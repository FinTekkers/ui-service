<script lang="ts">
    // external imports
    import { onMount } from "svelte";
    // internal imports
    import { installCodeLang } from "../../lib/uidata";

    let commandIsCopied: boolean = false;
    let contentIsCopied: boolean = false;
    let copiedContent: HTMLElement | null;
    let copiedCommand: HTMLElement | null;

    const { Typescript } = installCodeLang;
    let codeLanguage: string = Typescript.language;
    let codeCommand: string = Typescript.installCMD;
    let codeContent: string = Typescript.importCode;

    const codeBlockData = installCodeLang;

    const clearIsCopied: () => void = () => {
        commandIsCopied = false;
        contentIsCopied = false;
    };

    onMount(() => {
        if (copiedContent !== null) {
            copiedContent =
                document.querySelector<HTMLElement>("#mycode_content");
        }

        if (copiedCommand !== null) {
            copiedCommand =
                document.querySelector<HTMLElement>("#mycode_command");
        }
    });

    const copyCode = async (copyRule: string) => {
        const callSetTimeout = (fnTobeCleared: Function, time: number) => {
            setTimeout(() => {
                fnTobeCleared();
            }, time);
        };

        try {
            if (copiedCommand !== null && copyRule === "command") {
                const copiedText = copiedCommand.textContent || "";
                await navigator.clipboard.writeText(copiedText);
                commandIsCopied = true;

                callSetTimeout(() => {
                    clearIsCopied();
                }, 1000);
            }
            if (copiedContent !== null && copyRule === "content") {
                const copiedText = copiedContent.textContent || "";
                await navigator.clipboard.writeText(copiedText);
                contentIsCopied = true;

                callSetTimeout(() => {
                    clearIsCopied();
                }, 1000);
            }
        } catch (error) {
            if (error) {
                console.log("unable to copy");
                console.log(error);
            }
        }
    };

    const toggleCodeLang = (lang: string) => {
        for (const [key, value] of Object.entries(codeBlockData)) {
            if (lang === key && codeBlockData !== null) {
                const { language, installCMD, importCode } = value;
                codeLanguage = language;
                codeCommand = installCMD;
                codeContent = importCode;
            }
        }
    };
</script>

<div class="code-block-installation-container">
    <div class="custom_header">
        {#each Object.entries(codeBlockData) as [key, _value]}
            <div
                class="custom_header_title"
                on:keydown={() => "x"}
                on:click={() => toggleCodeLang(key)}
            >
                {key}
            </div>
        {/each}
    </div>
    <div class="custom_codeblock">
        <div
            class="copy_btn"
            on:keydown={() => "x"}
            on:click={() => copyCode("command")}
        >
            {commandIsCopied ? "👍" : "Copy"}
        </div>
        <div class="code_language">{codeLanguage}</div>
        <div class="code_content" id="mycode_command">
            {codeCommand}
        </div>
    </div>
    <div class="custom_codeblock">
        <div
            class="copy_btn"
            on:keydown={() => "x"}
            on:click={() => copyCode("content")}
        >
            {contentIsCopied ? "👍" : "Copy"}
        </div>
        <div class="code_language">{codeLanguage}</div>
        <div class="code_content" id="mycode_content">
            {codeContent}
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../styles/_shared.scss";

    .code-block-installation-container {
        display: grid;
        grid-template-columns: 1fr;
        width: 48vw;
    }

    .custom_header {
        @include flex(row, center, center, 1em);
        border-radius: $bd-radius;
        position: relative;
        z-index: 3;

        .custom_header_title {
            width: 100px;
            padding: 0.2em;
            text-align: center;
            border-radius: $bd-radius;
            background: $white;
            color: black;
            cursor: pointer;
            transition: all 0.5s ease-in-out;

            &:hover {
                background: $primary-color;
                color: $white;
            }
        }
    }

    .custom_codeblock {
        width: 100%;
        height: max-content;
        background: rgb(24, 24, 24);
        padding: 1em;
        border-radius: $bd-radius;
        position: relative;
        margin: 1em 0;

        .code_language {
            position: absolute;
            font-size: 0.8rem;
            text-transform: uppercase;
            color: $grey;
            top: 0.5em;
        }

        .copy_btn {
            background: rgba(66, 66, 66, 0.527);
            width: max-content;
            padding: 0.2em 0.6em;
            border-radius: 15px;
            position: absolute;
            font-size: 0.9rem;
            width: 5em;
            right: 5px;
            top: 5px;
            cursor: pointer;
            transition: all 0.5s ease-in-out;
            text-align: center;

            &:hover {
                color: $primary-color;
                background-color: $white;
            }
        }

        .code_content {
            margin-top: 2em;
            height: max-content;
            overflow: hidden;
            white-space: pre-wrap;
        }
    }

    @media screen and (max-width: $breakingpoint_medium) {
        .code-block-installation-container {
            width: 100%;
        }

        .custom_codeblock {
            width: 80%;
            margin: 1em auto;

            .code_content {
                max-width: 100%;
            }
        }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        .custom_codeblock {
            width: 90vw;

            .code_content {
                max-width: 100%;
            }
        }
    }
</style>
