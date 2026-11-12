package com.shelfsense.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "circulation_loans")
public class CirculationLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_code", unique = true, nullable = false, length = 32)
    private String loanCode;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @NotNull
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(nullable = false, length = 32)
    private String status = "ISSUED"; // "ISSUED", "RETURNED", "OVERDUE"

    @Column(name = "fine_per_day", precision = 8, scale = 2)
    private BigDecimal finePerDay = new BigDecimal("5.00");

    @Column(name = "calculated_fine", precision = 8, scale = 2)
    private BigDecimal calculatedFine = BigDecimal.ZERO;

    @Column(name = "fine_paid", nullable = false)
    private Boolean finePaid = false;

    public CirculationLoan() {
    }

    public CirculationLoan(String loanCode, Book book, Member member, LocalDate issueDate, LocalDate dueDate,
                           LocalDate returnDate, String status, BigDecimal finePerDay, BigDecimal calculatedFine, Boolean finePaid) {
        this.loanCode = loanCode;
        this.book = book;
        this.member = member;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.status = status;
        this.finePerDay = finePerDay;
        this.calculatedFine = calculatedFine;
        this.finePaid = finePaid;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLoanCode() {
        return loanCode;
    }

    public void setLoanCode(String loanCode) {
        this.loanCode = loanCode;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getFinePerDay() {
        return finePerDay;
    }

    public void setFinePerDay(BigDecimal finePerDay) {
        this.finePerDay = finePerDay;
    }

    public BigDecimal getCalculatedFine() {
        return calculatedFine;
    }

    public void setCalculatedFine(BigDecimal calculatedFine) {
        this.calculatedFine = calculatedFine;
    }

    public Boolean getFinePaid() {
        return finePaid;
    }

    public void setFinePaid(Boolean finePaid) {
        this.finePaid = finePaid;
    }
}

