package com.gitfix.connection;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class GitHubConnectionController {

    private final GitHubConnectionService connectionService;

    @PostMapping
    public ResponseEntity<ConnectionResponse> createConnection(@Valid @RequestBody ConnectionRequest request) {
        ConnectionResponse response = connectionService.createConnection(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ConnectionResponse>> getAllConnections() {
        return ResponseEntity.ok(connectionService.getAllConnections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConnectionResponse> getConnectionById(@PathVariable String id) {
        return ResponseEntity.ok(connectionService.getConnectionById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConnection(@PathVariable String id) {
        connectionService.deleteConnection(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/webhook")
    public ResponseEntity<Map<String, Object>> registerWebhook(@PathVariable String id) {
        Map<String, Object> result = connectionService.registerGitHubWebhook(id);
        return ResponseEntity.ok(result);
    }
}
