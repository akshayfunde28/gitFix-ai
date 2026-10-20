package com.gitfix.job;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable String id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<JobLogResponse>> getJobLogs(@PathVariable String id) {
        return ResponseEntity.ok(jobService.getJobLogs(id));
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<JobAttemptResponse>> getJobAttempts(@PathVariable String id) {
        return ResponseEntity.ok(jobService.getJobAttempts(id));
    }

    @PostMapping("/manual")
    public ResponseEntity<JobResponse> triggerManualJob(@Valid @RequestBody ManualJobRequest request) {
        JobResponse response = jobService.triggerManualJob(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<JobResponse> retryJob(@PathVariable String id) {
        JobResponse response = jobService.retryJob(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
