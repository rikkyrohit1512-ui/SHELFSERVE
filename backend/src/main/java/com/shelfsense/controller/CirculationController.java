package com.shelfsense.controller;

import com.shelfsense.dto.IssueRequestDTO;
import com.shelfsense.dto.ReturnRequestDTO;
import com.shelfsense.entity.CirculationLoan;
import com.shelfsense.service.CirculationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/circulation")
@CrossOrigin(origins = "*")
public class CirculationController {

    private final CirculationService circulationService;

    public CirculationController(CirculationService circulationService) {
        this.circulationService = circulationService;
    }

    @GetMapping("/loans")
    public ResponseEntity<List<CirculationLoan>> getLoans(@RequestParam(required = false) Long memberId) {
        if (memberId != null) {
            return ResponseEntity.ok(circulationService.getLoansByMember(memberId));
        }
        return ResponseEntity.ok(circulationService.getAllLoans());
    }

    @PostMapping("/issue")
    public ResponseEntity<CirculationLoan> issueBook(@Valid @RequestBody IssueRequestDTO request) {
        CirculationLoan loan = circulationService.issueBook(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(loan);
    }

    @PostMapping("/return/{loanId}")
    public ResponseEntity<CirculationLoan> returnBook(
            @PathVariable Long loanId,
            @RequestBody(required = false) ReturnRequestDTO request) {
        if (request == null) {
            request = new ReturnRequestDTO();
        }
        CirculationLoan loan = circulationService.returnBook(loanId, request);
        return ResponseEntity.ok(loan);
    }

    @PostMapping("/renew/{loanId}")
    public ResponseEntity<CirculationLoan> renewBook(@PathVariable Long loanId) {
        CirculationLoan loan = circulationService.renewBook(loanId);
        return ResponseEntity.ok(loan);
    }
}

