import * as vscode from "vscode";

export class TemplateRenderer {
  private edge?: {
    render: (template: string, state: Record<string, unknown>) => Promise<string>;
    mount: (disk: string | URL, viewsDirectory?: string | URL) => any;
  };
  private readonly viewsPath: string;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.viewsPath = vscode.Uri.joinPath(this.extensionUri, "media").fsPath;
  }

  private async getEngine() {
    if (this.edge) {
      return this.edge;
    }

    const { Edge } = await import("edge.js");
    const engine = Edge.create();
    engine.mount(this.viewsPath);
    this.edge = engine;
    return engine;
  }

  async render(templateName: string, variables: Record<string, unknown>) {
    const engine = await this.getEngine();
    return engine.render(templateName, variables);
  }
}
