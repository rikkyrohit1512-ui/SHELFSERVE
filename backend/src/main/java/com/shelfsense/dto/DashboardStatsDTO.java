package com.shelfsense.dto;

import java.math.BigDecimal;

public class DashboardStatsDTO {

    private long totalTitles;
    private long totalCopies;
    private long availableCopies;
    private long issuedBooks;
    private long overdueBooks;
    private BigDecimal pendingFines;
    private int availabilityRate;

    public DashboardStatsDTO() {
    }

    public DashboardStatsDTO(long totalTitles, long totalCopies, long availableCopies, long issuedBooks, long overdueBooks, BigDecimal pendingFines) {
        this.totalTitles = totalTitles;
        this.totalCopies = totalCopies;
        this.availableCopies = availableCopies;
        this.issuedBooks = issuedBooks;
        this.overdueBooks = overdueBooks;
        this.pendingFines = pendingFines != null ? pendingFines : BigDecimal.ZERO;
        this.availabilityRate = totalCopies > 0 ? (int) Math.round(((double) availableCopies / totalCopies) * 100) : 0;
    }

    public long getTotalTitles() {
        return totalTitles;
    }

    public void setTotalTitles(long totalTitles) {
        this.totalTitles = totalTitles;
    }

    public long getTotalCopies() {
        return totalCopies;
    }

    public void setTotalCopies(long totalCopies) {
        this.totalCopies = totalCopies;
    }

    public long getAvailableCopies() {
        return availableCopies;
    }

    public void setAvailableCopies(long availableCopies) {
        this.availableCopies = availableCopies;
    }

    public long getIssuedBooks() {
        return issuedBooks;
    }

    public void setIssuedBooks(long issuedBooks) {
        this.issuedBooks = issuedBooks;
    }

    public long getOverdueBooks() {
        return overdueBooks;
    }

    public void setOverdueBooks(long overdueBooks) {
        this.overdueBooks = overdueBooks;
    }

    public BigDecimal getPendingFines() {
        return pendingFines;
    }

    public void setPendingFines(BigDecimal pendingFines) {
        this.pendingFines = pendingFines;
    }

    public int getAvailabilityRate() {
        return availabilityRate;
    }

    public void setAvailabilityRate(int availabilityRate) {
        this.availabilityRate = availabilityRate;
    }
}

