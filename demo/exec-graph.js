// Execution Graph
// Each stage of the pipeline is an ExecNode. The graph records timing,
// inputs, and outputs so execution is observable and the UI can animate it.

export class ExecutionGraph {
  constructor(intentId) {
    this.intentId = intentId;
    this.nodes = [];
    this._listeners = [];
  }

  addNode(id, label, capability) {
    const node = {
      id,
      label,
      capability,
      status: 'pending',
      startedAt: null,
      endedAt: null,
      inputs: [],
      outputs: [],
      durationMs: null,
    };
    this.nodes.push(node);
    this._emit();
    return node;
  }

  start(id) {
    const n = this._get(id);
    if (!n) return;
    n.status = 'running';
    n.startedAt = performance.now();
    this._emit();
  }

  complete(id, outputs = []) {
    const n = this._get(id);
    if (!n) return;
    n.status = 'success';
    n.endedAt = performance.now();
    n.durationMs = n.startedAt != null ? Math.round(n.endedAt - n.startedAt) : null;
    n.outputs = outputs;
    this._emit();
  }

  fail(id, reason) {
    const n = this._get(id);
    if (!n) return;
    n.status = 'failed';
    n.endedAt = performance.now();
    n.durationMs = n.startedAt != null ? Math.round(n.endedAt - n.startedAt) : null;
    n.outputs = [reason || 'error'];
    this._emit();
  }

  onChange(fn) { this._listeners.push(fn); }

  _get(id) { return this.nodes.find(n => n.id === id); }
  _emit() { this._listeners.forEach(fn => fn(this.nodes)); }
}

// ── Renderer ──────────────────────────────────────────────────────────────────
// Renders a vertical node chain into a container element. Each node is a row:
//   [icon] [label · capability/timing] + a wrapped row of evidence chips.
// Every stage that completes leaves visible artifacts behind, so the graph
// reads as computation producing evidence rather than boxes changing colour.

const STATUS_ICON = { pending: '○', running: '◆', success: '●', failed: '✕' };
const STATUS_CLASS = { pending: 'eg-pending', running: 'eg-running', success: 'eg-success', failed: 'eg-failed' };

function chipText(value) {
  const s = String(value ?? '').trim();
  return s.length > 28 ? s.slice(0, 27) + '…' : s;
}

export function renderExecGraph(container, nodes) {
  if (!container) return;
  container.innerHTML = '';

  nodes.forEach((node, i) => {
    const wrap = document.createElement('div');
    wrap.className = `eg-node ${STATUS_CLASS[node.status] || ''}`;
    wrap.dataset.id = node.id;

    const icon = document.createElement('span');
    icon.className = 'eg-icon';
    icon.textContent = STATUS_ICON[node.status] || '○';

    const body = document.createElement('span');
    body.className = 'eg-body';

    const header = document.createElement('span');
    header.className = 'eg-header-row';

    const name = document.createElement('span');
    name.className = 'eg-label';
    name.textContent = node.label;

    const meta = document.createElement('span');
    meta.className = 'eg-meta';
    if (node.status === 'running') {
      meta.textContent = node.capability;
    } else if (node.status === 'success') {
      meta.textContent = node.durationMs != null ? `${node.capability} · ${node.durationMs}ms` : node.capability;
    } else if (node.status === 'failed') {
      meta.textContent = node.outputs[0] || 'failed';
    } else {
      meta.textContent = node.capability;
    }

    header.appendChild(name);
    header.appendChild(meta);
    body.appendChild(header);

    // Evidence chips — the artifacts each stage emits. Only render once the
    // node has produced something meaningful (success with outputs).
    const evidence = (node.status === 'success' || node.status === 'failed')
      ? (node.outputs || []).filter(o => o != null && String(o).trim() !== '')
      : [];
    if (evidence.length) {
      const chips = document.createElement('span');
      chips.className = 'eg-evidence';
      evidence.forEach(o => {
        const chip = document.createElement('span');
        chip.className = 'eg-chip';
        chip.textContent = chipText(o);
        chip.title = String(o);
        chips.appendChild(chip);
      });
      body.appendChild(chips);
    }

    wrap.appendChild(icon);
    wrap.appendChild(body);
    container.appendChild(wrap);

    // Connector between nodes. Once the upstream node has completed, the edge
    // is "live" — the execution wave has passed through it.
    if (i < nodes.length - 1) {
      const line = document.createElement('div');
      const flowed = node.status === 'success';
      const failed = node.status === 'failed';
      line.className = `eg-connector${flowed ? ' eg-connector-live' : ''}${failed ? ' eg-connector-dead' : ''}`;
      container.appendChild(line);
    }
  });
}
