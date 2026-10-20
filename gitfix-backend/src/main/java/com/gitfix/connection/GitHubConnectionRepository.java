package com.gitfix.connection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GitHubConnectionRepository extends JpaRepository<GitHubConnection, String> {
    Optional<GitHubConnection> findByRepoFullName(String repoFullName);
}
