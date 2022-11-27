package common.model.security;

import java.time.LocalDate;

public class Auction {
    private final LocalDate auctionDate;
    private final LocalDate issueDate;
    private final LocalDate announcementDate;

    public Auction(LocalDate auctionDate, LocalDate issueDate, LocalDate announcementDate) {
        this.auctionDate = auctionDate;
        this.issueDate = issueDate;
        this.announcementDate = announcementDate;
    }

    public LocalDate getAuctionDate() {
        return auctionDate;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public LocalDate getAnnouncementDate() {
        return announcementDate;
    }
}