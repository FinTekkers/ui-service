pub mod fintekkers {
    pub mod models {
        include!("fintekkers.models.portfolio.rs");
        include!("fintekkers.models.position.rs");
        include!("fintekkers.models.price.rs");
        include!("fintekkers.models.security.rs");
        include!("fintekkers.models.strategy.rs");
        include!("fintekkers.models.transaction.rs");
        include!("fintekkers.models.util.lock.rs");
        include!("fintekkers.models.util.rs");
    }

    pub mod requests {
        include!("fintekkers.requests.portfolio.rs");
        include!("fintekkers.requests.position.rs");
        include!("fintekkers.requests.security.rs");
        include!("fintekkers.requests.transaction.rs");
        include!("fintekkers.requests.util.errors.rs");
        include!("fintekkers.requests.util.lock.rs");
        include!("fintekkers.requests.util.rs");
        include!("fintekkers.requests.valuation.rs");
    }

    pub mod services {
        include!("fintekkers.services.lock_service.rs");
        include!("fintekkers.services.position_service.rs");
        include!("fintekkers.services.security_service.rs");
        include!("fintekkers.services.valuation_service.rs");
    }
}
