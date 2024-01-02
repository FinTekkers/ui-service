

export const userArchetypes: Obr.userArchetypes[] = [{
    title: "Business user",
    content: "Save money",
    link: "Business landing page",
    type: "Business"
}
    , {
    title: "Engineers",
    content: "Develop a product",
    link: "Engineer landing page",
    type: "Engineer"
}]

export const installCodeLang: Obr.codeBlockData[] = [{
    codeLanguage: {
        language: "Typescript",
        installCMD: " npm i @fintekkers/ledger-models",
        importCode: `
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

}, {
    codeLanguage: {
        language: "Python",
        installCMD: "pip install fintekkers-ledger-models",
        importCode: `
        //NOTE: Needs a few changes

        from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
        from fintekkers.requests.portfolio.query_portfolio_request_pb2 import (
            QueryPortfolioRequestProto,
        )
        from fintekkers.wrappers.services.portfolio import PortfolioService
        from fintekkers.wrappers.models.util.date_utils import datetime
        
        
        def test_transaction_position():
            now = datetime.now()
        
            portfolioService = PortfolioService()
        
            request = QueryPortfolioRequestProto(
                search_portfolio_input=PositionFilterProto(), as_of=now
            )
        
            searchResults = portfolioService.search(request)
        
            for searchResult in searchResults:
                print(searchResult.get_name())
                break
        
        `
    }
}, {
    codeLanguage: {
        language: "Java",
        installCMD: `<dependency>
        <groupId>io.github.fintekkers</groupId>
        <artifactId>ledger-models</artifactId>
        <version>0.1.68</version>
      </dependency>
      
      see <a href="https://github.com/FinTekkers/ledger-models/packages/1743372">github packages</a>`,
        importCode: `
TODO - Need to write the Java server script
               `
    }
}]


export const sideBarURLText: App.NavbarURL[] = [{
    url: '#todo_link_to_repl_when_complete',
    text: 'Get Started',
    id: 'get-started',
    icon: 'material-symbols:finance-mode'
}, {
    url: 'https://github.com/FinTekkers/ledger-models',
    text: 'Docs',
    id: 'documentation',
    icon: 'solar:document-outline'
}
    , {
    url: '#',
    text: 'Pricing (free)',
    id: 'pricing',
    icon: 'akar-icons:price-cut'
}]