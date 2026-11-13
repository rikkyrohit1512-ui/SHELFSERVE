

const API_BASE_URL =
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? "http://localhost:8080/api/v1"
        : "https://shelfserve-backend.onrender.com/api/v1";
const ShelfSenseAPI = {
    librarianAuth: null,

    setLibrarianCredentials(username, password) {
        this.librarianAuth = "Basic " + btoa(
            String.fromCharCode(
                ...new TextEncoder().encode(`${username}:${password}`)
            )
        );
    },

    clearLibrarianCredentials() {
        this.librarianAuth = null;
    },

    async request(endpoint, options = {}) {        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
          headers: {
    "Content-Type": "application/json",
    ...(this.librarianAuth
        ? { "Authorization": this.librarianAuth }
        : {}),
    ...(options.headers || {})
}
        });

        if (!response.ok) {
            const responseBody = await response.text();
            let message = responseBody;
            try {
                const error = JSON.parse(responseBody);
                message = error.message || error.error || responseBody;
            } catch {
                // Non-JSON error responses are displayed as plain text.
            }
            const error = new Error(message || `API Error: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    },

    getBooks() {
        return this.request("/books");
    },
        getBooks() {
        return this.request("/books");
    },

    createBook(data) {
        return this.request("/books", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    updateBook(id, data) {
        return this.request(`/books/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    deleteBook(id) {
        return this.request(`/books/${id}`, {
            method: "DELETE"
        });
    },

    getMembers() {
        return this.request("/members");
    },

    getMember(id) {
        return this.request(`/members/${encodeURIComponent(id)}`);
    },

    getLoans() {
        return this.request("/circulation/loans");
    },
    getMemberLoans(memberId) {
        return this.request(`/circulation/loans?memberId=${encodeURIComponent(memberId)}`);
    },
    issueBook(data) {
    return this.request("/circulation/issue", {
        method: "POST",
        body: JSON.stringify(data)
    });
},

returnBook(loanId, data) {
    return this.request(`/circulation/return/${loanId}`, {
        method: "POST",
        body: JSON.stringify(data)
    });
},

renewBook(loanId) {
    return this.request(`/circulation/renew/${loanId}`, {
        method: "POST"
    });
},

    getDashboardStats() {
        return this.request("/dashboard/stats");
    },
    createBook(data) {
    return this.request("/books", {
        method: "POST",
        body: JSON.stringify(data)
    });
},

updateBook(id, data) {
    return this.request(`/books/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
},

deleteBook(id) {
    return this.request(`/books/${id}`, {
        method: "DELETE"
    });
},

createMember(data) {
    return this.request("/members", {
        method: "POST",
        body: JSON.stringify(data)
    });
},

updateMember(id, data) {
    return this.request(`/members/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
},

deactivateMember(id) {
    return this.request(`/members/${id}/deactivate`, {
        method: "POST"
    });
},

reactivateMember(id) {
    return this.request(`/members/${id}/reactivate`, {
        method: "POST"
    });
},

deleteMember(id) {
    return this.request(`/members/${id}`, {
        method: "DELETE"
    });
},
};
