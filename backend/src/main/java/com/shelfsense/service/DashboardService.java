package com.shelfsense.service;

import com.shelfsense.dto.DashboardStatsDTO;
import com.shelfsense.repository.BookRepository;
import com.shelfsense.repository.CirculationLoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final BookRepository bookRepository;
    private final CirculationLoanRepository loanRepository;

    public DashboardService(BookRepository bookRepository, CirculationLoanRepository loanRepository) {
        this.bookRepository = bookRepository;
        this.loanRepository = loanRepository;
    }

    public DashboardStatsDTO getDashboardStats() {
        long totalTitles = bookRepository.count();
        long totalCopies = bookRepository.sumTotalCopies();
        long availableCopies = bookRepository.sumAvailableCopies();
        long issuedLoans = loanRepository.countTotalActiveLoans();
        long overdueLoans = loanRepository.countOverdueLoans();
        BigDecimal pendingFines = loanRepository.sumTotalPendingFines();

        return new DashboardStatsDTO(
                totalTitles,
                totalCopies,
                availableCopies,
                issuedLoans,
                overdueLoans,
                pendingFines != null ? pendingFines : BigDecimal.ZERO
        );
    }
}

