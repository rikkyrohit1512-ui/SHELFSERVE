package com.shelfsense.controller;

import com.shelfsense.entity.Member;
import com.shelfsense.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@CrossOrigin(origins = "*")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public ResponseEntity<List<Member>> getAllMembers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {
        List<Member> members = memberService.getAllMembers(search, role);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getMemberById(@PathVariable Long id) {
        Member member = memberService.getMemberById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with ID: " + id));
        return ResponseEntity.ok(member);
    }

    @PostMapping
    public ResponseEntity<Member> createMember(@Valid @RequestBody Member member) {
        Member saved = memberService.registerMember(member);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Member> updateMember(@PathVariable Long id, @Valid @RequestBody Member member) {
        Member updated = memberService.updateMember(id, member);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Member> deactivateMember(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.deactivateMember(id));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Member> reactivateMember(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.reactivateMember(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }
}
