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
// Renders a vertical node chain into a container element.

const STATUS_ICON = { pending: '○', running: '◎', success: '●', failed: '✕' };
const STATUS_CLASS = { pending: 'eg-pending', running: 'eg-running', success: 'eg-success', failed: 'eg-failed' };

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

    const name = document.createElement('span');
    name.className = 'eg-label';
    name.textContent = node.label;

    const meta = document.createElement('span');
    meta.className = 'eg-meta';
    if (node.status === 'running') {
      meta.textContent = node.capability;
    } else if (node.status === 'success' && node.durationMs != null) {
      meta.textContent = `${node.durationMs}ms`;
    } else if (node.status === 'failed') {
      meta.textContent = node.outputs[0] || 'failed';
    } else {
      meta.textContent = node.capability;
    }

    body.appendChild(name);
    body.appendChild(meta);
    wrap.appendChild(icon);
    wrap.appendChild(body);
    container.appendChild(wrap);

    // Connector line between nodes
    if (i < nodes.length - 1) {
      const line = document.createElement('div');
      line.className = 'eg-connector';
      container.appendChild(line);
    }
  });
}
