package com.shelfsense.repository;

import com.shelfsense.entity.CirculationLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CirculationLoanRepository extends JpaRepository<CirculationLoan, Long> {

    Optional<CirculationLoan> findByLoanCode(String loanCode);

    List<CirculationLoan> findByMemberId(Long memberId);

    boolean existsByMemberId(Long memberId);

    List<CirculationLoan> findByStatus(String status);

    @Query("SELECT COUNT(l) FROM CirculationLoan l WHERE l.member.id = :memberId AND l.status <> 'RETURNED'")
    long countActiveLoansByMember(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(l) FROM CirculationLoan l WHERE l.book.id = :bookId AND l.status <> 'RETURNED'")
    long countActiveLoansByBook(@Param("bookId") Long bookId);

    @Query("SELECT COUNT(l) FROM CirculationLoan l WHERE l.status = 'ISSUED' OR l.status = 'OVERDUE'")
    long countTotalActiveLoans();

    @Query("SELECT COUNT(l) FROM CirculationLoan l WHERE l.status = 'OVERDUE'")
    long countOverdueLoans();

    @Query("SELECT COALESCE(SUM(l.calculatedFine), 0) FROM CirculationLoan l WHERE l.finePaid = false AND l.calculatedFine > 0")
    BigDecimal sumTotalPendingFines();
}
