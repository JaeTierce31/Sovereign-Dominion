import * as Automerge from '@automerge/automerge';

export interface ProjectDoc {
  projectId: string;
  elements: any[];
  comments: { id: string; text: string; author: string; timestamp: number }[];
  lastModified: number;
}

export class MultiUserSession {
  private doc: Automerge.Doc<ProjectDoc>;
  private peers: Map<string, RTCDataChannel> = new Map();

  constructor(projectId: string) {
    this.doc = Automerge.init<ProjectDoc>();
    this.doc = Automerge.change(this.doc, d => {
      d.projectId = projectId;
      d.elements = [];
      d.comments = [];
      d.lastModified = Date.now();
    });
  }

  addElement(element: any) {
    this.doc = Automerge.change(this.doc, d => {
      d.elements.push(element);
      d.lastModified = Date.now();
    });
    this.broadcast();
  }

  addComment(text: string, author: string) {
    this.doc = Automerge.change(this.doc, d => {
      d.comments.push({ id: crypto.randomUUID(), text, author, timestamp: Date.now() });
    });
    this.broadcast();
  }

  applyRemoteChanges(changes: Uint8Array[]) {
    const [newDoc] = Automerge.applyChanges(this.doc, changes);
    this.doc = newDoc as Automerge.Doc<ProjectDoc>;
  }

  private broadcast() {
    const changes = Automerge.getChanges(Automerge.init<ProjectDoc>(), this.doc);
    for (const channel of this.peers.values()) {
      if (channel.readyState === 'open') {
        changes.forEach(c => channel.send(c.buffer as ArrayBuffer));
      }
    }
  }

  getDoc() { return this.doc; }
}
