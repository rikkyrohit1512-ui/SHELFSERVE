package com.shelfsense.dto;

import java.time.LocalDate;

public class ReturnRequestDTO {

    private LocalDate returnDate;
    private Boolean fineCollected = true;

    public ReturnRequestDTO() {
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public Boolean getFineCollected() {
        return fineCollected;
    }

    public void setFineCollected(Boolean fineCollected) {
        this.fineCollected = fineCollected;
    }
}

