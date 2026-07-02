// Charter → predicate compiler — the seam kernel/README.md flagged as
// remaining: turns a Constitution charter's `appliesWhen`/`mustHold` strings
// (see constitution/*.yaml) into real, safe, callable predicates, so the
// charter stops being an illustration and becomes what invariant.js already
// promises to enforce.
//
// Deliberately NOT eval/new Function over the YAML strings — this is a small
// hand-written tokenizer + recursive-descent parser + tree-walking
// interpreter over a restricted expression grammar. The only "code" that
// runs is this file's own; charter text can only reach data already present
// on the evaluation context (`ctx.intent`, `ctx.subject`) plus a fixed,
// explicit set of built-ins (`now`, `sha256`, `all`) and a fixed whitelist of
// array methods (`every`, `some`, `includes`). Nothing else is reachable.
//
// Grammar (precedence low → high):
//   expr       := or
//   or         := and ('||' and)*
//   and        := equality ('&&' equality)*
//   equality   := comparison (('=='|'!=') comparison)*
//   comparison := infixWord (('<'|'<='|'>'|'>=') infixWord)*
//   infixWord  := unary (('in'|'subsetOf'|'contains'|'startsWith') unary)*
//   unary      := '!' unary | postfix
//   postfix    := primary ('.' IDENT | '[' expr ']' | '(' args ')')*
//   primary    := NUMBER | STRING | BOOL | NULL | IDENT | '(' expr ')'
//   args       := (arg (',' arg)*)?
//   arg        := IDENT '=>' expr | expr

import { hash } from './hash.js';

// ── Tokenizer ────────────────────────────────────────────────────────────

const TWO_CHAR_PUNCT = new Set(['==', '!=', '<=', '>=', '&&', '||', '=>']);
const ONE_CHAR_PUNCT = new Set(['<', '>', '!', '(', ')', '.', ',', '[', ']']);
const INFIX_WORDS = new Set(['in', 'subsetOf', 'contains', 'startsWith']);

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  const isDigit = (c) => c >= '0' && c <= '9';
  const isIdentStart = (c) => /[A-Za-z_]/.test(c);
  const isIdentPart = (c) => /[A-Za-z0-9_]/.test(c);

  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }

    if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1;
      let s = '';
      while (j < n && src[j] !== quote) {
        if (src[j] === '\\' && j + 1 < n) { s += src[j + 1]; j += 2; } else { s += src[j]; j++; }
      }
      if (j >= n) throw new SyntaxError(`Unterminated string in: ${src}`);
      tokens.push({ type: 'STRING', value: s });
      i = j + 1;
      continue;
    }

    if (isDigit(c)) {
      let j = i;
      while (j < n && (isDigit(src[j]) || src[j] === '.')) j++;
      tokens.push({ type: 'NUMBER', value: Number(src.slice(i, j)) });
      i = j;
      continue;
    }

    if (isIdentStart(c)) {
      let j = i;
      while (j < n && isIdentPart(src[j])) j++;
      const word = src.slice(i, j);
      if (word === 'true') tokens.push({ type: 'BOOL', value: true });
      else if (word === 'false') tokens.push({ type: 'BOOL', value: false });
      else if (word === 'null') tokens.push({ type: 'NULL', value: null });
      else tokens.push({ type: 'IDENT', value: word });
      i = j;
      continue;
    }

    const two = src.slice(i, i + 2);
    if (TWO_CHAR_PUNCT.has(two)) { tokens.push({ type: 'PUNCT', value: two }); i += 2; continue; }
    if (ONE_CHAR_PUNCT.has(c)) { tokens.push({ type: 'PUNCT', value: c }); i++; continue; }

    throw new SyntaxError(`Unexpected character '${c}' at position ${i} in: ${src}`);
  }
  tokens.push({ type: 'EOF', value: null });
  return tokens;
}

// ── Parser ───────────────────────────────────────────────────────────────

function parse(tokens, source) {
  let pos = 0;
  const peek = () => tokens[pos];
  const at = (type, value) => peek().type === type && (value === undefined || peek().value === value);
  const advance = () => tokens[pos++];
  const expect = (type, value) => {
    if (!at(type, value)) {
      throw new SyntaxError(`Expected ${value ?? type} but got '${peek().value}' in: ${source}`);
    }
    return advance();
  };

  function parseExpr() { return parseOr(); }

  function parseOr() {
    let node = parseAnd();
    while (at('PUNCT', '||')) { advance(); node = { type: 'Or', left: node, right: parseAnd() }; }
    return node;
  }

  function parseAnd() {
    let node = parseEquality();
    while (at('PUNCT', '&&')) { advance(); node = { type: 'And', left: node, right: parseEquality() }; }
    return node;
  }

  function parseEquality() {
    let node = parseComparison();
    while (at('PUNCT', '==') || at('PUNCT', '!=')) {
      const op = advance().value;
      node = { type: 'Eq', op, left: node, right: parseComparison() };
    }
    return node;
  }

  function parseComparison() {
    let node = parseInfixWord();
    while (at('PUNCT', '<') || at('PUNCT', '<=') || at('PUNCT', '>') || at('PUNCT', '>=')) {
      const op = advance().value;
      node = { type: 'Cmp', op, left: node, right: parseInfixWord() };
    }
    return node;
  }

  function parseInfixWord() {
    let node = parseUnary();
    while (peek().type === 'IDENT' && INFIX_WORDS.has(peek().value)) {
      const op = advance().value;
      node = { type: 'InfixWord', op, left: node, right: parseUnary() };
    }
    return node;
  }

  function parseUnary() {
    if (at('PUNCT', '!')) { advance(); return { type: 'Not', expr: parseUnary() }; }
    return parsePostfix();
  }

  function parsePostfix() {
    let node = parsePrimary();
    for (;;) {
      if (at('PUNCT', '.')) {
        advance();
        const name = expect('IDENT').value;
        node = { type: 'Member', obj: node, prop: name };
      } else if (at('PUNCT', '[')) {
        advance();
        const index = parseExpr();
        expect('PUNCT', ']');
        node = { type: 'Index', obj: node, index };
      } else if (at('PUNCT', '(')) {
        advance();
        const args = [];
        if (!at('PUNCT', ')')) {
          args.push(parseArg());
          while (at('PUNCT', ',')) { advance(); args.push(parseArg()); }
        }
        expect('PUNCT', ')');
        node = { type: 'Call', callee: node, args };
      } else {
        break;
      }
    }
    return node;
  }

  function parseArg() {
    // Lambda lookahead: IDENT '=>' ...
    if (peek().type === 'IDENT' && tokens[pos + 1] && tokens[pos + 1].type === 'PUNCT' && tokens[pos + 1].value === '=>') {
      const param = advance().value;
      advance(); // '=>'
      return { type: 'Lambda', param, body: parseExpr() };
    }
    return parseExpr();
  }

  function parsePrimary() {
    const t = peek();
    if (t.type === 'NUMBER') { advance(); return { type: 'Literal', value: t.value }; }
    if (t.type === 'STRING') { advance(); return { type: 'Literal', value: t.value }; }
    if (t.type === 'BOOL') { advance(); return { type: 'Literal', value: t.value }; }
    if (t.type === 'NULL') { advance(); return { type: 'Literal', value: null }; }
    if (t.type === 'IDENT') { advance(); return { type: 'Ident', name: t.value }; }
    if (at('PUNCT', '(')) {
      advance();
      const node = parseExpr();
      expect('PUNCT', ')');
      return node;
    }
    throw new SyntaxError(`Unexpected token '${t.value}' in: ${source}`);
  }

  const ast = parseExpr();
  expect('EOF');
  return ast;
}

// ── Evaluator ────────────────────────────────────────────────────────────

class Scope {
  constructor(vars, parent = null) { this.vars = vars; this.parent = parent; }
  has(name) { return name in this.vars || (this.parent ? this.parent.has(name) : false); }
  get(name) {
    if (name in this.vars) return this.vars[name];
    if (this.parent) return this.parent.get(name);
    throw new ReferenceError(`Unknown identifier '${name}'`);
  }
  child(vars) { return new Scope(vars, this); }
}

const ARRAY_METHODS = new Set(['every', 'some', 'includes']);

function truthy(v) { return !!v; }

function looseEquals(a, b) {
  if (a === null || a === undefined) return b === null || b === undefined;
  return a === b;
}

/** sha256(x) — mock, bound to hash.js's placeholder (same swap point as proof.js/audit.js). */
function sha256Builtin(x) { return hash(x); }

function allBuiltin(arr, pred) { return Array.isArray(arr) && arr.every((x) => truthy(pred(x))); }
function anyBuiltin(arr, pred) { return Array.isArray(arr) && arr.some((x) => truthy(pred(x))); }

function makeEvaluator(ordinals) {
  function compareOrdinal(l, r, op) {
    let lv = l;
    let rv = r;
    if (ordinals && typeof l === 'string' && typeof r === 'string' && l in ordinals && r in ordinals) {
      lv = ordinals[l];
      rv = ordinals[r];
    }
    switch (op) {
      case '<': return lv < rv;
      case '<=': return lv <= rv;
      case '>': return lv > rv;
      case '>=': return lv >= rv;
      default: throw new Error(`Unknown comparison operator '${op}'`);
    }
  }

  function evaluate(node, scope) {
    switch (node.type) {
      case 'Literal': return node.value;
      case 'Ident': return scope.get(node.name);
      case 'Member': {
        const obj = evaluate(node.obj, scope);
        return obj == null ? undefined : obj[node.prop];
      }
      case 'Index': {
        const obj = evaluate(node.obj, scope);
        const idx = evaluate(node.index, scope);
        return obj == null ? undefined : obj[idx];
      }
      case 'Call': {
        const { callee, args } = node;
        const evalArg = (a) => (a.type === 'Lambda' ? makeClosure(a, scope) : evaluate(a, scope));
        if (callee.type === 'Ident') {
          const fn = scope.get(callee.name);
          if (typeof fn !== 'function') throw new TypeError(`'${callee.name}' is not callable`);
          return fn(...args.map(evalArg));
        }
        if (callee.type === 'Member') {
          const receiver = evaluate(callee.obj, scope);
          if (Array.isArray(receiver) && ARRAY_METHODS.has(callee.prop)) {
            return receiver[callee.prop](...args.map(evalArg));
          }
          throw new TypeError(
            `Method '.${callee.prop}()' is not supported on ${Array.isArray(receiver) ? 'arrays' : typeof receiver}`
          );
        }
        throw new TypeError('Unsupported call target');
      }
      case 'Not': return !evaluate(node.expr, scope);
      case 'And': return truthy(evaluate(node.left, scope)) && truthy(evaluate(node.right, scope));
      case 'Or': return truthy(evaluate(node.left, scope)) || truthy(evaluate(node.right, scope));
      case 'Eq': {
        const eq = looseEquals(evaluate(node.left, scope), evaluate(node.right, scope));
        return node.op === '==' ? eq : !eq;
      }
      case 'Cmp': return compareOrdinal(evaluate(node.left, scope), evaluate(node.right, scope), node.op);
      case 'InfixWord': {
        const l = evaluate(node.left, scope);
        const r = evaluate(node.right, scope);
        switch (node.op) {
          case 'in': return Array.isArray(r) ? r.includes(l) : !!(r && typeof r === 'object' && l in r);
          case 'subsetOf': return Array.isArray(l) && Array.isArray(r) && l.every((x) => r.includes(x));
          case 'contains':
            if (Array.isArray(l)) return l.includes(r);
            if (typeof l === 'string') return l.includes(r);
            return false;
          case 'startsWith': return typeof l === 'string' && l.startsWith(r);
          default: throw new Error(`Unknown infix word operator '${node.op}'`);
        }
      }
      case 'Lambda': throw new Error('A lambda may only appear as a call argument');
      default: throw new Error(`Unknown AST node type '${node.type}'`);
    }
  }

  function makeClosure(lambdaNode, scope) {
    return (arg) => evaluate(lambdaNode.body, scope.child({ [lambdaNode.param]: arg }));
  }

  return evaluate;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Compile one predicate string (an `appliesWhen` or `mustHold` value from a
 * charter YAML) into a `(ctx) => boolean` function.
 * @param {string} source
 * @param {object} [options]
 * @param {Record<string, number>} [options.ordinals]  named ranks for
 *   otherwise-unordered string values (e.g. NSPIRE severity), so `<`/`>=`
 *   compare by rank instead of falling back to lexicographic string order.
 * @param {Record<string, Function>} [options.functions]  extra callables
 *   made available to the expression alongside the built-in `now`, `sha256`,
 *   `all`, `any` (e.g. a domain's `allowedPurposes`).
 */
export function compilePredicate(source, options = {}) {
  const ast = parse(tokenize(source), source);
  const evaluate = makeEvaluator(options.ordinals);
  return function evaluatePredicate(ctx) {
    const rootScope = new Scope({
      action: ctx.intent?.action,
      intent: ctx.intent,
      subject: ctx.subject,
      now: ctx.now || (() => Date.now()),
      sha256: sha256Builtin,
      all: allBuiltin,
      any: anyBuiltin,
      ...(options.functions || {}),
    });
    return truthy(evaluate(ast, rootScope));
  };
}

/**
 * Compile one invariant spec (as written in a charter YAML's `invariants[]`)
 * into the shape `invariant.js`'s `Constitution`/`defineInvariant` expects:
 * `{ id, appliesWhen, mustHold, onViolation, rationale }` with real functions.
 */
export function compileInvariant(spec, options = {}) {
  if (!spec || typeof spec.id !== 'string' || typeof spec.mustHold !== 'string') {
    throw new Error('compileInvariant requires { id, mustHold } (appliesWhen optional)');
  }
  return {
    id: spec.id,
    appliesWhen: spec.appliesWhen ? compilePredicate(spec.appliesWhen, options) : () => true,
    mustHold: compilePredicate(spec.mustHold, options),
    onViolation: spec.onViolation === 'rollback' ? 'rollback' : 'block',
    rationale: spec.rationale || '',
  };
}

/**
 * Compile a whole parsed charter object (the JS value you get from parsing a
 * charter YAML file, e.g. `constitution/charter.housing-inspection.example.yaml`,
 * with any YAML library — this module takes the parsed object, not YAML text,
 * to stay dependency-free) into ready-to-use invariants.
 * @param {{ charter?: object, invariants: object[] }} charterObj
 * @param {object} [options]  see compilePredicate
 * @returns {{ meta: object, invariants: object[] }}
 */
export function compileCharter(charterObj, options = {}) {
  if (!charterObj || !Array.isArray(charterObj.invariants)) {
    throw new Error('compileCharter requires { invariants: [...] }');
  }
  return {
    meta: charterObj.charter || {},
    invariants: charterObj.invariants.map((spec) => compileInvariant(spec, options)),
  };
}
