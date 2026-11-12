
package com.shelfsense.service;

import com.shelfsense.dto.IssueRequestDTO;
import com.shelfsense.entity.Book;
import com.shelfsense.entity.CirculationLoan;
import com.shelfsense.entity.Member;
import com.shelfsense.repository.BookRepository;
import com.shelfsense.repository.CirculationLoanRepository;
import com.shelfsense.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CirculationServiceTest {

    @Mock
    private CirculationLoanRepository loanRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private CirculationService circulationService;

    @Test
    void rejectsLoanToSuspendedMemberWithoutChangingBookOrLoanHistory() {
        Book book = book();
        Member member = member("SUSPENDED");
        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));
        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> circulationService.issueBook(issueRequest()));

        assertEquals(
                "Cannot issue a book to inactive member 'Test Member'. Reactivate the member before issuing a loan.",
                exception.getMessage());
        assertEquals(1, book.getAvailableCopies());
        verify(bookRepository, never()).save(any(Book.class));
        verify(loanRepository, never()).save(any(CirculationLoan.class));
    }

    @Test
    void stillIssuesLoanToActiveMember() {
        Book book = book();
        Member member = member("ACTIVE");
        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));
        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));
        when(loanRepository.countActiveLoansByMember(5L)).thenReturn(0L);
        when(loanRepository.count()).thenReturn(0L);
        when(loanRepository.save(any(CirculationLoan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CirculationLoan loan = circulationService.issueBook(issueRequest());

        assertNotNull(loan);
        assertEquals(member, loan.getMember());
        assertEquals(0, book.getAvailableCopies());
        verify(bookRepository).save(book);
        verify(loanRepository).save(any(CirculationLoan.class));
    }

    private IssueRequestDTO issueRequest() {
        IssueRequestDTO request = new IssueRequestDTO();
        request.setBookId(10L);
        request.setMemberId(5L);
        return request;
    }

    private Book book() {
        Book book = new Book();
        book.setId(10L);
        book.setTitle("Test Book");
        book.setAvailableCopies(1);
        book.setTotalCopies(1);
        return book;
    }

    private Member member(String status) {
        Member member = new Member();
        member.setId(5L);
        member.setName("Test Member");
        member.setStatus(status);
        member.setMaxAllowedLoans(3);
        return member;
    }
}
