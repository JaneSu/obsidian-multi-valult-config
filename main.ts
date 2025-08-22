import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFolder,
	AbstractInputSuggest,
	SearchComponent,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface IMultiVaultConfig {
	mySetting: string;
}

interface IAreaConfigItem {
	areaPath: string;
	imagePath: string;
	notePath: string;
}

const DEFAULT_SETTINGS: IAreaConfigItem[] = [];

export default class MultiVaultConfig extends Plugin {
	settings: IAreaConfigItem[] = [];

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new MultiVaultConfigModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new MultiVaultConfigModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MultiVaultConfigSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		const data = await this.loadData();
		console.log("🚀 ~ MultiVaultConfig ~ loadSettings ~ data:", data);
		this.settings = [
			...(Array.isArray(data) ? data : []),
			...DEFAULT_SETTINGS,
		];
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MultiVaultConfigModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class MultiVaultConfigSettingTab extends PluginSettingTab {
	plugin: MultiVaultConfig;

	constructor(app: App, plugin: MultiVaultConfig) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		if (this.plugin.settings.length === 0) {
			this.displayBlankPage();
		} else {
			this.displayConfigPage();
		}
	}

	private displayConfigPage() {
		const { containerEl } = this;

		containerEl.empty();
	}

	private displayBlankPage() {
		const { containerEl } = this;

		new Setting(containerEl)
			.setName("Multi Vault Config")
			.setHeading()
			// .setDesc("It's a secret")
			.addButton((button) =>
				button.setButtonText("Add Vault").onClick(() => {
					// 先添加新的配置项到设置数组
					this.plugin.settings.push({
						areaPath: "",
						imagePath: "",
						notePath: "",
					});

					// 获取当前配置项的索引（数组长度-1）
					const currentIndex = this.plugin.settings.length - 1;
					const currentVaultNum = currentIndex + 1;

					console.log(
						"🚀 ~ MultiVaultConfigSettingTab ~ display ~ currentIndex:",
						currentIndex
					);
					console.log(
						"🚀 ~ MultiVaultConfigSettingTab ~ display ~ this.plugin.settings:",
						this.plugin.settings
					);

					// Vault 配置标题
					new Setting(containerEl)
						.setName(`Vault ${currentVaultNum}`)
						.setHeading();

					// Vault 路径配置
					new Setting(containerEl)
						.setName(`Vault ${currentVaultNum} 路径`)
						.addText((text) => {
							text.setPlaceholder("输入 vault 路径")
								.setValue(
									this.plugin.settings[currentIndex].areaPath
								)
								.onChange(async (value) => {
									this.plugin.settings[
										currentIndex
									].areaPath = value;
									await this.plugin.saveSettings();
								});

							new InputSearchSuggest(this.app, text.inputEl);
						});

					// 新笔记地址配置
					new Setting(containerEl)
						.setName("新笔记地址")
						.addText((text) => {
							text.setPlaceholder("输入新笔记保存路径")
								.setValue(
									this.plugin.settings[currentIndex].notePath
								)
								.onChange(async (value) => {
									console.log(
										"🚀 ~ notePath onChange ~ value:",
										value
									);
									this.plugin.settings[
										currentIndex
									].notePath = value;
									await this.plugin.saveSettings();
								});

							new InputSearchSuggest(this.app, text.inputEl);
						});

					// 图片地址配置
					new Setting(containerEl)
						.setName("图片地址")
						.addText((text) => {
							text.setPlaceholder("输入图片保存路径")
								.setValue(
									this.plugin.settings[currentIndex].imagePath
								)
								.onChange(async (value) => {
									console.log(
										"🚀 ~ imagePath onChange ~ value:",
										value
									);
									this.plugin.settings[
										currentIndex
									].imagePath = value;
									await this.plugin.saveSettings();
								});

							new InputSearchSuggest(this.app, text.inputEl);
						});
				})
			);
	}
}

class InputSearchSuggest extends AbstractInputSuggest<any> {
	constructor(app: App, textInputEl: HTMLInputElement) {
		super(app, textInputEl);
	}

	// 获取文件夹建议的辅助函数
	private getFolderSuggestions(): string[] {
		const allFiles = this.app.vault.getAllLoadedFiles();
		const folders = allFiles
			.filter((file) => file instanceof TFolder)
			.map((folder: TFolder) => folder.path)
			.sort();

		// 添加根目录选项
		return ["/", ...folders];
	}

	getSuggestions(query: string): string[] {
		const folders = this.getFolderSuggestions();

		const suggestions = folders.filter((path: string) =>
			path.toLowerCase().includes(query)
		);

		return suggestions;
	}

	renderSuggestion(item: string, el: HTMLElement) {
		el.setText(item);
	}

	selectSuggestion(value: any, evt: MouseEvent | KeyboardEvent): void {
		this.setValue(value);
		// 选择成功后关闭建议列表
		this.close();
	}
}
