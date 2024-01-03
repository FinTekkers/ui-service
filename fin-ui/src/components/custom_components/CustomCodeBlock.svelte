<script lang="ts">
    import { onMount } from "svelte";
    import { installCodeLang } from '../../lib/uidata';
    
    let commandIsCopied:boolean = false;
    let contentIsCopied:boolean = false;
    let copiedContent:HTMLElement|null;
    let copiedCommand:HTMLElement|null;

    let codeLanguage:string = 'Typescript';
    let codeCommand:string = `npm i @fintekkers/ledger-models`;
    let codeContent:string = `// Model Utils
    import { FieldProto } from '../../../fintekkers/models/position/field_pb';
    import * as uuid from '../../models/utils/uuid';
    import * as dt from '../../models/utils/datetime';
         
//Requests & Services
    import { PortfolioService } from './PortfolioService';

    const now = dt.ZonedDateTime.now();

    const portfolioService = new PortfolioService();

    var searchResults = await portfolioService.searchPortfolio(now.toProto(), 
    new PositionFilter().addEqualsFilter(FieldProto.PORTFOLIO_NAME, 
    'Federal Reserve SOMA Holdings'));
    console.log(searchResults[0].getPortfolioName());
               `;

    const codeBlockData:Obr.codeBlockData[]= installCodeLang;


    const clearIsCopied = ()=>{
        commandIsCopied = false;
        contentIsCopied = false;
    }

     onMount(() => {
         if(copiedContent !== null){
             copiedContent = document.querySelector<HTMLElement>('#mycode_content');
         }

         if(copiedCommand !==null){
            copiedCommand = document.querySelector<HTMLElement>('#mycode_command');
         }
     });

    const copyCode = async (copyRule:string)=>{
        try{

            if(copiedCommand !== null && copyRule === 'command'){
            const copiedText =  copiedCommand.textContent || '';
            await navigator.clipboard.writeText(copiedText);
            commandIsCopied = true;

            setTimeout(clearIsCopied ,1000);

            }
            if(copiedContent !== null && copyRule === 'content'){
            const copiedText =  copiedContent.textContent || '';
            await navigator.clipboard.writeText(copiedText);
            contentIsCopied = true;

            setTimeout(clearIsCopied ,1000);

            }

        }catch(error){

            if(error){
                console.log('unable to copy')
                console.log(error)
            }
 
        }
       
    }

    const toggleCodeLang = (lang:string)=>{
       if(lang === 'Typescript' && codeBlockData.length!==0){
           const {language, installCMD,importCode} =  codeBlockData[0].codeLanguage;
           codeLanguage = language;
           codeCommand = installCMD;
           codeContent = importCode;
       }
       if(lang === 'Rust' && codeBlockData.length!==0){
           const {language, installCMD,importCode} =  codeBlockData[1].codeLanguage;
           codeLanguage = language;
           codeCommand = installCMD;
           codeContent = importCode;
       }
       if(lang === 'Java' && codeBlockData.length!==0){
           const {language, installCMD,importCode} =  codeBlockData[2].codeLanguage;
           codeLanguage = language;
           codeCommand = installCMD;
           codeContent = importCode;
       }
       

    }
    
</script>

<div class="code-block-installation-container">
    <div class="custom_header">
        <div class="custom_header_title" on:click={()=>toggleCodeLang('Typescript')}>Typescript</div>
        <div class="custom_header_title" on:click={()=>toggleCodeLang('Rust')}>Rust</div>
        <div class="custom_header_title" on:click={()=>toggleCodeLang('Java')}>Java</div>
    </div>
    <div class="custom_codeblock">
    <div class="copy_btn" on:click={()=>copyCode('command')}>{commandIsCopied ? '👍' : "Copy"}</div>
    <div class="code_language">{codeLanguage}</div>
    <div class="code_content" id="mycode_command">
         {codeCommand}
    </div>
    </div>
    <div class="custom_codeblock">
    <div class="copy_btn" on:click={()=>copyCode('content')}>{contentIsCopied ? '👍' : "Copy"}</div>
    <div class="code_language">{codeLanguage}</div>
    <div class="code_content" id="mycode_content">
         {codeContent}
    </div>
    </div>

</div>


<style lang="scss">
    @import "../../style.scss";

    .code-block-installation-container{
        display: grid;
        grid-template-columns: 1fr;
        width: 48vw;
        


        
    }

    .custom_header{
        @include flex(row,center, center, 1em);
        border-radius: $bd-radius;
        position: relative;
        z-index: 3;
        


        .custom_header_title{
            width: 100px;
            padding: .2em;
            text-align: center;
            border-radius: $bd-radius;
            background: $white;
            color: black;
            cursor: pointer;
            transition: all .5s ease-in-out;

            &:hover{
                background: $primary-color;
                color: $white;
            }
        }
    }

    .custom_codeblock{
        width: 100%;
        height: max-content;
        background:rgb(24, 24, 24);
        padding:  1em;
        border-radius: $bd-radius;
        position: relative;
        // min-width: 20vw;
        margin: 1em 0;

        .code_language{
            position: absolute;
            font-size: .8rem;
            text-transform: uppercase;
            color: $grey;
            top: 0.5em;
        }

        .copy_btn{
            background:rgba(66, 66, 66, 0.527);
            width: max-content;
            padding: .2em .6em;
            border-radius: 15px;
            position: absolute;
            font-size: .9rem;
            width: 5em;
            right: 5px;
            top: 5px;
            cursor: pointer;
            transition: all .5s ease-in-out;
            text-align: center;

            &:hover{
                color: $primary-color;
                background-color:$white;
            }
        }

        .code_content{
            margin-top: 2em;
            // width: 100%;
            // max-width: 50vw;
            height: max-content;
            overflow: hidden;
            white-space:pre-wrap;
        
        }
    }

    @media screen and (max-width: $breakingpoint_medium) {

    .code-block-installation-container{
        width: 100%;

    }

    

    .custom_codeblock{
        width: 80%;
        margin: 1em auto;


        .code_content{
            max-width: 100%;
        }
        }
    }


    @media screen and (max-width:$breakingpoint_mobile){
    .custom_codeblock{
       width: 90vw;


       .code_content{
           max-width: 100%;
       }
    }

}

</style>