package com.sofimed;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.sofimed")
@EntityScan("com.sofimed.Model")
@EnableJpaRepositories("com.sofimed.Dao")
public class SofimedApplication {
    public static void main(String[] args) {
        SpringApplication.run(SofimedApplication.class, args);
    }
} 