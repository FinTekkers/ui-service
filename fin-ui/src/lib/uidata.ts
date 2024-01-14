

export const userArchetypes: App.userArchetypes[] = [{
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

export const installCodeLang = {
    Typescript: {
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

    Python: {
        language: "Python",
        installCMD: "pip install fintekkers-ledger-models",
        importCode: `
        from fintekkers.models.position.field_pb2 import FieldProto
        from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
        from fintekkers.wrappers.services.portfolio import PortfolioService
        
        portfolio_to_find = "Federal Reserve SOMA Holdings"    
        portfolioService = PortfolioService()
    
        request = QueryPortfolioRequest.create_query_request({
                FieldProto.PORTFOLIO_NAME: portfolio_to_find,
        })
    
        searchResults: list[Portfolio] = list(portfolioService.search(request))
        print(searchResults[0].get_name())
    `
    },

    Java: {
        language: "Java",
        installCMD: `<dependency>
<groupId>io.github.fintekkers</groupId>
<artifactId>ledger-models</artifactId>
<version>0.1.68</version>
</dependency>

see <a href="https://github.com/FinTekkers/ledger-models/packages/1743372">github packages</a>`,
        importCode: `
        import fintekkers.models.position.*;
        import fintekkers.requests.portfolio.*;        

        PortfolioService portfolioService = PortfolioService.getInstance();

        QueryPortfolioRequestProto request = QueryPortfolioRequestProto.newBuilder()
                .setSearchPortfolioInput(PositionFilterProto.newBuilder()
                        .addFilters(
                                FieldMapEntry.newBuilder()
                                        .setField(FieldProto.PORTFOLIO_NAME)
                                        .setStringValue("Federal Reserve SOMA Holdings").build()
                        ).build()).build();

        QueryPortfolioResponseProto result = portfolioService.search(request).next();
        System.out.println(result.getPortfolioResponseList().get(0).getPortfolioName());
        `
    }
}


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

export const footerURLText: App.FooterSection[] = [
    {
        title: "More info",
        links: [
            { text: "Home", url: "#" },
            { text: "About us", url: "https://www.linkedin.com/company/fintekkers" },
            { text: "Contact info", url: "https://www.linkedin.com/company/fintekkers" }
        ]
    },
    {
        title: "Useful links",
        links: [
            { text: "Github Ledger Models", url: "#" },
            { text: "Code Examples", url: "#" },
            { text: "Support", url: "#" }
        ]
    }
]


export const installCodeLangMap: App.codeBlockData[] = [{
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
        from fintekkers.models.position.field_pb2 import FieldProto
        from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
        from fintekkers.wrappers.services.portfolio import PortfolioService
        
        portfolio_to_find = "Federal Reserve SOMA Holdings"
    
        portfolioService = PortfolioService()
    
        request = QueryPortfolioRequest.create_query_request(
            {
                FieldProto.PORTFOLIO_NAME: portfolio_to_find,
            }
        )
        
        searchResults = portfolioService.search(request)
    
        portfolio_name = None
        for searchResult in searchResults:
            portfolio_name = searchResult.get_name()
            break
    
        assert portfolio_name == portfolio_to_find        
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