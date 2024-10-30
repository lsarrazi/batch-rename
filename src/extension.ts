'use strict'
import * as vscode from 'vscode'
const fs = require('fs')
const PathModule = require('path')

export function activate(context: vscode.ExtensionContext) {
    // Enregistrement de la commande
    var current_renaming

    let disposableRenameCommand = vscode.commands.registerCommand('extension.renameBatch', (clicked_file, selected_files) => {
        if (!selected_files) return

        current_renaming = {
            files: []
        }

        selected_files.forEach(file => {
            file.basename = PathModule.basename(file.fsPath)
            file.basepath = file.fsPath.substring(0, file.fsPath.lastIndexOf(file.basename))
            current_renaming.files.push(file)
        })

        let batchFilePath = PathModule.join(__dirname, '.Batch Rename.txt')
        let content = current_renaming.files.map(file => file.basename).join('\n')
        fs.writeFileSync(batchFilePath, content)

        var openPath = vscode.Uri.file(batchFilePath)

        vscode.workspace.openTextDocument(openPath).then(doc => {
            current_renaming.doc = doc
            vscode.window.showTextDocument(doc).then(editor => {
                // Éditeur ouvert
            })

            // Fonction de sauvegarde modifiée pour utiliser WorkspaceEdit
            current_renaming.save = async function() {
                let new_names = doc.getText().split(/[\r\n]+/).filter(line => !!line);

                if (current_renaming.files.length == new_names.length) {
                    const edit = new vscode.WorkspaceEdit();
                    for (let i = 0; i < current_renaming.files.length; i++) {
                        const file = current_renaming.files[i];
                        let num = 1;
                        let new_name = new_names[i];
                        let new_path = PathModule.join(file.basepath, new_name);

                        if (file.fsPath === new_path) continue;

                        // Vérifier si le nouveau chemin existe déjà
                        let adjusted_new_path = new_path;
                        while (fs.existsSync(adjusted_new_path)) {
                            adjusted_new_path = PathModule.join(file.basepath, new_name.replace(/\.(?=[A-z0-9]*$)/, `_${num}.`));
                            num++;
                        }

                        const oldUri = vscode.Uri.file(file.fsPath);
                        const newUri = vscode.Uri.file(adjusted_new_path);

                        // Ajouter l'opération de renommage au WorkspaceEdit
                        edit.renameFile(oldUri, newUri, { overwrite: false, ignoreIfExists: false });
                    }

                    // Appliquer les modifications
                    const success = await vscode.workspace.applyEdit(edit);
                    if (success) {
                        vscode.window.showInformationMessage('Les fichiers ont été renommés avec succès et les imports ont été mis à jour.');
                    } else {
                        vscode.window.showErrorMessage('Échec du renommage des fichiers.');
                    }

                } else {
                    vscode.window.showInformationMessage('Le nombre de lignes ne correspond pas à la sélection de fichiers !')
                }
                // Fermer l'éditeur et supprimer le fichier temporaire
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                fs.unlink(batchFilePath, (err) => {
                    if (err) console.error(err);
                });
            }
        })

    })

    vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (doc === current_renaming.doc) {
            try {
                await current_renaming.save();
            } catch (error) {
                vscode.window.showErrorMessage(`Erreur lors du renommage : ${error.message}`);
            }
        }
    })
    // Ajouter à la liste des abonnements pour une gestion automatique
    context.subscriptions.push(disposableRenameCommand)

}

// Cette méthode est appelée lorsque l'extension est désactivée
export function deactivate() {}
