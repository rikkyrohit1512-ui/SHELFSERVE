package com.shelfsense.service;

import com.shelfsense.entity.Book;
import com.shelfsense.repository.BookRepository;
import com.shelfsense.repository.CirculationLoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final CirculationLoanRepository loanRepository;

    public BookService(BookRepository bookRepository, CirculationLoanRepository loanRepository) {
        this.bookRepository = bookRepository;
        this.loanRepository = loanRepository;
    }

    public List<Book> getAllBooks(String query, String category) {
        if (query != null && !query.trim().isEmpty()) {
            return bookRepository.searchBooks(query.trim());
        }
        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
            return bookRepository.findByCategory(category.trim());
        }
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    public Optional<Book> getBookByCode(String code) {
        return bookRepository.findByBookCode(code);
    }

    public List<Book> getBooksByRack(String rackId) {
        return bookRepository.findByRackId(rackId);
    }

    public Book saveBook(Book book) {
        if (book.getBookCode() == null || book.getBookCode().trim().isEmpty()) {
            long count = bookRepository.count();
            book.setBookCode("BK-" + (100 + count + 1));
        }
        if (book.getAvailableCopies() == null) {
            book.setAvailableCopies(book.getTotalCopies());
        }
        return bookRepository.save(book);
    }

    public Book updateBook(Long id, Book updatedData) {
        Book existing = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + id));

        long loanedCopies = loanRepository.countActiveLoansByBook(id);
        if (updatedData.getTotalCopies() < loanedCopies) {
            throw new IllegalStateException("Cannot reduce total copies to " + updatedData.getTotalCopies() +
                    ". There are currently " + loanedCopies + " copies loaned out.");
        }

        existing.setTitle(updatedData.getTitle());
        existing.setAuthor(updatedData.getAuthor());
        existing.setIsbn(updatedData.getIsbn());
        existing.setCategory(updatedData.getCategory());
        existing.setPublisher(updatedData.getPublisher());
        existing.setPublicationYear(updatedData.getPublicationYear());
        existing.setTotalCopies(updatedData.getTotalCopies());
        existing.setAvailableCopies(updatedData.getTotalCopies() - (int) loanedCopies);
        existing.setFloor(updatedData.getFloor());
        existing.setSection(updatedData.getSection());
        existing.setRackId(updatedData.getRackId());
        existing.setShelfId(updatedData.getShelfId());
        existing.setLocation(updatedData.getLocation());

        return bookRepository.save(existing);
    }

    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + id));

        long loanedCopies = loanRepository.countActiveLoansByBook(id);
        if (loanedCopies > 0) {
            throw new IllegalStateException("Cannot delete book '" + book.getTitle() + "'. " +
                    loanedCopies + " copy/copies are currently issued to members.");
        }

        bookRepository.delete(book);
    }
}

