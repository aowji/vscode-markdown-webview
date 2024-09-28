import * as vscode from 'vscode';
import markdownit from 'markdown-it';
import emoji from 'markdown-it-emoji';
import highlightjs from 'markdown-it-highlightjs';
import puppeteer, { PDFOptions } from 'puppeteer';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const md = markdownit({
		html: true,
		linkify: true,
		typographer: true,
	});
	md.use(emoji.full);
	md.use(highlightjs);
	{
		const defaultRenderer = md.renderer.rules.fence!.bind(md.renderer.rules)
		md.renderer.rules.fence = (tokens: any, idx: number, options: any, env: any, slf: any) => {
			const token = tokens[idx]
			const code = token.content.trim()
			const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
			let langName = ''
			if (info)
				langName = info.split(/\s+/g)[0]

			switch (langName) {
				case 'mermaid':
					// var html = null;
					// var result = mermaid.mermaidAPI.render("1", code, (sc)=>{html=sc});
					return `<pre class="mermaid">${code}</pre>`;
				case 'markmap':
					return `<pre class="markmap">${code}</pre>`;
			}
			return defaultRenderer(tokens, idx, options, env, slf)
		}
	}

	function genWebviewContent(markdownText: string) {
		var content = md.render(markdownText);
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Markdown Preview</title>
			<link rel="stylesheet" href="https://unpkg.com/github-markdown-css/github-markdown.css">
			<link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets/styles/1c-light.min.css">
		</head>
		<body>
			<div class="markdown-body">
				${content}
			</div>
			<script src="https://unpkg.com/mermaid/dist/mermaid.min.js"></script>
			<script src="https://unpkg.com/markmap-autoloader/dist/index.js"></script>
			<script>
				mermaid.initialize({ startOnLoad: true });
			</script>
		</body>
		</html>`;
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "lw" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('lw.helloWorld', () => {
		// Create and show panel
		const panel = vscode.window.createWebviewPanel(
			'lw',
			'Markdown Preview',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true
			}
		);
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			var tid: any = null;
			vscode.workspace.onDidChangeTextDocument((e) => {
				if (e.document == editor.document) {
					if (tid) {
						clearTimeout(tid);
					}
					tid = setTimeout(() => {
						panel.webview.html = genWebviewContent(editor.document.getText());
					}, 500);
				}
			});
			panel.webview.html = genWebviewContent(editor.document.getText());
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('lw.print', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			// Get the document text
			const documentText = editor.document.getText();
			var finalHtml = genWebviewContent(documentText);

			const browser = await puppeteer.launch({
				args: ["--no-sandbox"],
				// headless: true,
			});
			const page = await browser.newPage();
			await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
				waitUntil: "networkidle2",
			});
			const options: PDFOptions = {
				format: "A4",
				headerTemplate: "<p></p>",
				footerTemplate: "<p></p>",
				displayHeaderFooter: false,
				margin: {
					top: "40px",
					bottom: "100px",
				},
				printBackground: true,
				path: "D:/invoice.pdf",
			};
			await page.pdf(options);
			await browser.close();

		}
	}));
}


// This method is called when your extension is deactivated
export function deactivate() { }
