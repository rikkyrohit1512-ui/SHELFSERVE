package com.shelfsense.service;

import com.shelfsense.entity.Member;
import com.shelfsense.repository.CirculationLoanRepository;
import com.shelfsense.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private CirculationLoanRepository loanRepository;

    @InjectMocks
    private MemberService memberService;

    @Test
    void deletesMemberWhenNoLoanRecordsExist() {
        Member member = member(5L);
        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));
        when(loanRepository.existsByMemberId(5L)).thenReturn(false);

        memberService.deleteMember(5L);

        verify(memberRepository).delete(member);
    }

    @Test
    void rejectsDeletionWhenHistoricalLoanRecordsExist() {
        Member member = member(5L);
        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));
        when(loanRepository.existsByMemberId(5L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> memberService.deleteMember(5L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(
                "Cannot delete member 'Test Member' because loan records exist. Loan history must be preserved.",
                exception.getReason());
        verify(memberRepository, never()).delete(member);
    }

    @Test
    void doesNotCheckLoansWhenMemberDoesNotExist() {
        when(memberRepository.findById(5L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> memberService.deleteMember(5L));

        verifyNoInteractions(loanRepository);
        verify(memberRepository, never()).delete(org.mockito.ArgumentMatchers.any(Member.class));
    }

    @Test
    void deactivatesMemberWithoutTouchingLoanHistory() {
        Member member = member(5L);
        member.setStatus("ACTIVE");
        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));
        when(memberRepository.save(member)).thenReturn(member);

        Member updated = memberService.deactivateMember(5L);

        assertEquals("SUSPENDED", updated.getStatus());
        verify(memberRepository).save(member);
        verifyNoInteractions(loanRepository);
    }

    @Test
    void reactivatesSuspendedMember() {
        Member member = member(5L);
        member.setStatus("SUSPENDED");
        when(memberRepository.findById(5L)).thenReturn(Optional.of(member));
        when(memberRepository.save(member)).thenReturn(member);

        Member updated = memberService.reactivateMember(5L);

        assertEquals("ACTIVE", updated.getStatus());
        verify(memberRepository).save(member);
    }

    private Member member(Long id) {
        Member member = new Member();
        member.setId(id);
        member.setName("Test Member");
        return member;
    }
}
