package com.shelfsense.service;

import com.shelfsense.dto.IssueRequestDTO;
import com.shelfsense.dto.ReturnRequestDTO;
import com.shelfsense.entity.Book;
import com.shelfsense.entity.CirculationLoan;
import com.shelfsense.entity.Member;
import com.shelfsense.repository.BookRepository;
import com.shelfsense.repository.CirculationLoanRepository;
import com.shelfsense.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class CirculationService {

    private final CirculationLoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public CirculationService(CirculationLoanRepository loanRepository, BookRepository bookRepository, MemberRepository memberRepository) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
    }

    public List<CirculationLoan> getAllLoans() {
        refreshOverdueFines();
        return loanRepository.findAll();
    }

    public List<CirculationLoan> getLoansByMember(Long memberId) {
        refreshOverdueFines();
        return loanRepository.findByMemberId(memberId);
    }

    public CirculationLoan issueBook(IssueRequestDTO request) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + request.getBookId()));

        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + request.getMemberId()));

        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException("Cannot issue a book to inactive member '" + member.getName() +
                    "'. Reactivate the member before issuing a loan.");
        }

        if (book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("No available copies on shelf for book: " + book.getTitle());
        }

        long activeLoans = loanRepository.countActiveLoansByMember(member.getId());
        if (activeLoans >= member.getMaxAllowedLoans()) {
            throw new IllegalStateException("Borrowing limit exceeded: Member " + member.getName() +
                    " already has " + activeLoans + " active loans (maximum: " + member.getMaxAllowedLoans() + ")");
        }

        // Deduct inventory
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        LocalDate issueDate = request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now();
        LocalDate dueDate = request.getDueDate() != null ? request.getDueDate() : issueDate.plusDays(14);

        long count = loanRepository.count();
        String loanCode = "LN-" + (8800 + count + 1);

        CirculationLoan loan = new CirculationLoan(
                loanCode,
                book,
                member,
                issueDate,
                dueDate,
                null,
                "ISSUED",
                new BigDecimal("5.00"),
                BigDecimal.ZERO,
                false
        );

        return loanRepository.save(loan);
    }

    public CirculationLoan returnBook(Long loanId, ReturnRequestDTO request) {
        CirculationLoan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan record not found with ID: " + loanId));

        if ("RETURNED".equalsIgnoreCase(loan.getStatus())) {
            throw new IllegalStateException("This book has already been returned and archived.");
        }

        LocalDate returnDate = request.getReturnDate() != null ? request.getReturnDate() : LocalDate.now();
        loan.setReturnDate(returnDate);
        loan.setStatus("RETURNED");

        // Calculate penalty if returned late
        if (returnDate.isAfter(loan.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(loan.getDueDate(), returnDate);
            BigDecimal fine = loan.getFinePerDay().multiply(BigDecimal.valueOf(daysOverdue));
            loan.setCalculatedFine(fine);
            loan.setFinePaid(request.getFineCollected() != null && request.getFineCollected());
        } else {
            loan.setCalculatedFine(BigDecimal.ZERO);
            loan.setFinePaid(true);
        }

        // Restock inventory copy
        Book book = loan.getBook();
        book.setAvailableCopies(Math.min(book.getTotalCopies(), book.getAvailableCopies() + 1));
        bookRepository.save(book);

        return loanRepository.save(loan);
    }

    public CirculationLoan renewBook(Long loanId) {
        CirculationLoan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan record not found with ID: " + loanId));

        if ("RETURNED".equalsIgnoreCase(loan.getStatus())) {
            throw new IllegalStateException("Cannot renew an already returned loan.");
        }

        LocalDate today = LocalDate.now();
        if (today.isAfter(loan.getDueDate())) {
            throw new IllegalStateException("Cannot renew an overdue book. Please return the book and settle pending penalties at the desk.");
        }

        // Extend due date by 14 days
        loan.setDueDate(loan.getDueDate().plusDays(14));
        return loanRepository.save(loan);
    }

    private void refreshOverdueFines() {
        LocalDate today = LocalDate.now();
        List<CirculationLoan> loans = loanRepository.findAll();
        for (CirculationLoan loan : loans) {
            if (!"RETURNED".equalsIgnoreCase(loan.getStatus())) {
                if (today.isAfter(loan.getDueDate())) {
                    loan.setStatus("OVERDUE");
                    long daysOverdue = ChronoUnit.DAYS.between(loan.getDueDate(), today);
                    loan.setCalculatedFine(loan.getFinePerDay().multiply(BigDecimal.valueOf(daysOverdue)));
                } else {
                    loan.setStatus("ISSUED");
                    loan.setCalculatedFine(BigDecimal.ZERO);
                }
                loanRepository.save(loan);
            }
        }
    }
}
