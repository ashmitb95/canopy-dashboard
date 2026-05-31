import { execFileSync } from "node:child_process";
import * as vscode from "vscode";

const PIPX_DOCS_URL = "https://pipx.pypa.io/stable/installation/";
const INSTALL_COMMAND = "pipx install canopy-cli && canopy setup-agent";

/**
 * One-click `pipx install canopy-cli` flow.
 *
 *   1. Verifies pipx is on the user's PATH via a login shell (since VSCode's
 *      own PATH is often minimal). If missing, offers to open the pipx
 *      install docs or fall back to the managed-venv installer.
 *   2. Opens an integrated terminal and runs `pipx install canopy-cli`
 *      followed by `canopy setup-agent`. The user sees output live.
 *   3. Surfaces a Reload Window notification so the extension picks up the
 *      newly installed CLI without the user hunting for the command.
 */
export async function runInstallCli(): Promise<void> {
  if (!hasPipx()) {
    const choice = await vscode.window.showWarningMessage(
      "Canopy: pipx is not on your PATH. The recommended install uses pipx.",
      "Open pipx install docs",
      "Use managed venv instead",
      "Cancel",
    );
    if (choice === "Open pipx install docs") {
      void vscode.env.openExternal(vscode.Uri.parse(PIPX_DOCS_URL));
    } else if (choice === "Use managed venv instead") {
      await vscode.commands.executeCommand("canopy.installBackend");
    }
    return;
  }

  const terminal = vscode.window.createTerminal({ name: "Canopy: Install CLI" });
  terminal.show();
  terminal.sendText(INSTALL_COMMAND, true);

  void vscode.window
    .showInformationMessage(
      "Canopy CLI is installing in the integrated terminal. Reload the window once it finishes to pick up the new binary.",
      "Reload Window",
    )
    .then((picked) => {
      if (picked === "Reload Window") {
        void vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    });
}

function hasPipx(): boolean {
  try {
    const shell = process.env.SHELL || "/bin/zsh";
    execFileSync(shell, ["-ilc", "command -v pipx"], {
      encoding: "utf8",
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}
