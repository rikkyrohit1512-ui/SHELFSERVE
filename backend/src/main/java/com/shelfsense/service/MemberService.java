package com.shelfsense.service;

import com.shelfsense.entity.Member;
import com.shelfsense.repository.CirculationLoanRepository;
import com.shelfsense.repository.MemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;
    private final CirculationLoanRepository loanRepository;

    public MemberService(MemberRepository memberRepository, CirculationLoanRepository loanRepository) {
        this.memberRepository = memberRepository;
        this.loanRepository = loanRepository;
    }

    public List<Member> getAllMembers(String query, String role) {
        if (query != null && !query.trim().isEmpty()) {
            return memberRepository.searchMembers(query.trim());
        }
        if (role != null && !role.trim().isEmpty() && !role.equalsIgnoreCase("ALL")) {
            return memberRepository.findByRole(role.trim());
        }
        return memberRepository.findAll();
    }

    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findById(id);
    }

    public Optional<Member> getMemberByCode(String code) {
        return memberRepository.findByMemberCode(code);
    }

    public Member registerMember(Member member) {
        if (member.getRollNo() != null && memberRepository.findByRollNo(member.getRollNo()).isPresent()) {
            throw new IllegalArgumentException("A member with Roll No / Staff ID '" + member.getRollNo() + "' already exists.");
        }
        if (member.getEmail() != null && memberRepository.findByEmail(member.getEmail()).isPresent()) {
            throw new IllegalArgumentException("A member with email '" + member.getEmail() + "' already exists.");
        }
        if (member.getMemberCode() == null || member.getMemberCode().trim().isEmpty()) {
            long count = memberRepository.count();
            member.setMemberCode("MEM-" + (200 + count + 1));
        }
        if (member.getMaxAllowedLoans() == null) {
            member.setMaxAllowedLoans("FACULTY".equalsIgnoreCase(member.getRole()) ? 6 : 3);
        }
        if (member.getStatus() == null || member.getStatus().trim().isEmpty()) {
            member.setStatus("ACTIVE");
        }
        return memberRepository.save(member);
    }

    public Member updateMember(Long id, Member updated) {
        Member existing = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + id));

        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setRole(updated.getRole());
        existing.setDepartment(updated.getDepartment());
        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }
        if (updated.getMaxAllowedLoans() != null) {
            existing.setMaxAllowedLoans(updated.getMaxAllowedLoans());
        }

        return memberRepository.save(existing);
    }

    public Member deactivateMember(Long id) {
        return changeMemberStatus(id, "SUSPENDED");
    }

    public Member reactivateMember(Long id) {
        return changeMemberStatus(id, "ACTIVE");
    }

    private Member changeMemberStatus(Long id, String status) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + id));
        member.setStatus(status);
        return memberRepository.save(member);
    }

    public void deleteMember(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + id));

        if (loanRepository.existsByMemberId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete member '" + member.getName() + "' because loan records exist. " +
                            "Loan history must be preserved.");
        }

        memberRepository.delete(member);
    }
}
