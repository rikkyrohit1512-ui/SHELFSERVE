package com.shelfsense.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_code", unique = true, nullable = false, length = 32)
    private String memberCode;

    @NotBlank(message = "Name is required")
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank(message = "Roll No / Staff ID is required")
    @Column(name = "roll_no", unique = true, nullable = false, length = 64)
    private String rollNo;

    @NotBlank(message = "Role is required")
    @Column(nullable = false, length = 32)
    private String role; // "STUDENT", "FACULTY", "ADMIN"

    @NotBlank(message = "Department is required")
    @Column(nullable = false, length = 100)
    private String department;

    @Email
    @NotBlank(message = "Email is required")
    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(nullable = false, length = 32)
    private String status = "ACTIVE"; // "ACTIVE", "SUSPENDED"

    @NotNull
    @Column(name = "max_allowed_loans", nullable = false)
    private Integer maxAllowedLoans = 3;

    @Column(name = "registration_date", updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate registrationDate;

    public Member() {
    }

    public Member(String memberCode, String name, String rollNo, String role, String department, String email, String phone, String status, Integer maxAllowedLoans) {
        this.memberCode = memberCode;
        this.name = name;
        this.rollNo = rollNo;
        this.role = role;
        this.department = department;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.maxAllowedLoans = maxAllowedLoans;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMemberCode() {
        return memberCode;
    }

    public void setMemberCode(String memberCode) {
        this.memberCode = memberCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRollNo() {
        return rollNo;
    }

    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getMaxAllowedLoans() {
        return maxAllowedLoans;
    }

    public void setMaxAllowedLoans(Integer maxAllowedLoans) {
        this.maxAllowedLoans = maxAllowedLoans;
    }

    public LocalDate getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDate registrationDate) {
        this.registrationDate = registrationDate;
    }

    @PrePersist
    protected void setRegistrationDateIfMissing() {
        if (registrationDate == null) {
            registrationDate = LocalDate.now();
        }
    }
}
