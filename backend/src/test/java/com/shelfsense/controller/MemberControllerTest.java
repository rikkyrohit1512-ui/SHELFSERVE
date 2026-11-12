package com.shelfsense.controller;

import com.shelfsense.exception.GlobalExceptionHandler;
import com.shelfsense.entity.Member;
import com.shelfsense.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MemberControllerTest {

    @Mock
    private MemberService memberService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new MemberController(memberService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returnsNoContentWhenMemberIsDeleted() throws Exception {
        mockMvc.perform(delete("/api/v1/members/5"))
                .andExpect(status().isNoContent());

        verify(memberService).deleteMember(5L);
    }

    @Test
    void returnsConflictAndMessageWhenLoanRecordsExist() throws Exception {
        String message = "Cannot delete member 'Test Member' because loan records exist. Loan history must be preserved.";
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, message))
                .when(memberService).deleteMember(5L);

        mockMvc.perform(delete("/api/v1/members/5"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(message));
    }

    @Test
    void returnsTheSelectedMemberDatabaseRecord() throws Exception {
        Member member = new Member();
        member.setId(5L);
        member.setMemberCode("MEM-205");
        member.setName("Test Member");
        member.setRollNo("FAC-005");
        member.setRole("FACULTY");
        member.setDepartment("Computer Science");
        member.setEmail("test@example.edu");
        member.setPhone("555-0100");
        member.setStatus("ACTIVE");
        member.setMaxAllowedLoans(6);
        member.setRegistrationDate(LocalDate.of(2026, 11, 12));
        when(memberService.getMemberById(5L)).thenReturn(Optional.of(member));

        mockMvc.perform(get("/api/v1/members/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.memberCode").value("MEM-205"))
                .andExpect(jsonPath("$.name").value("Test Member"))
                .andExpect(jsonPath("$.email").value("test@example.edu"))
                .andExpect(jsonPath("$.phone").value("555-0100"))
                .andExpect(jsonPath("$.registrationDate").value("2026-11-12"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void exposesMemberDeactivationAndReactivationActions() throws Exception {
        Member member = new Member();
        member.setId(5L);
        member.setName("Test Member");
        member.setStatus("SUSPENDED");
        when(memberService.deactivateMember(5L)).thenReturn(member);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/members/5/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        member.setStatus("ACTIVE");
        when(memberService.reactivateMember(5L)).thenReturn(member);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/members/5/reactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
