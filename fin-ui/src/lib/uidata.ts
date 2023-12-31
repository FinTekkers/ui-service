

export const userArchetypes :Obr.userArchetypes[] = [{
    title:"Business user",
    content:"Save money",
    link:"Business landing page",
    type:"Business"
}
,{
    title:"Engineers",
    content:"Develop a product",
    link:"Engineer landing page",
    type:"Engineer"
}] 

export const installCodeLang : Obr.codeBlockData[]=[{
    codeLanguage:{
            language:"Typescript",
            installCMD:" npm i @fintekkers/ledger-models",
            importCode:`
// Model Utils
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
               `
        },
    
}, {codeLanguage:{
            language:"Rust",
            installCMD:" rst i @fintekkers/ledger-models",
            importCode:`
// Model Utils
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
               `
        }},{codeLanguage:{
            language:"Java",
            installCMD:" java i @fintekkers/ledger-models",
            importCode:`
// Model Utils
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
               `
        }}]


export const sideBarURLText:App.NavbarURL[] = [{
    url:'#todo_link_to_repl_when_complete',
    text:'Get Started',
    id:'get-started',
    icon:'material-symbols:finance-mode'
  },{
    url:'https://github.com/FinTekkers/ledger-models',
    text:'Docs',
    id:'documentation',
    icon:'solar:document-outline'
  } 
  ,{
    url:'#',
    text:'Pricing (free)',
    id:'pricing',
    icon:'akar-icons:price-cut'
  }]