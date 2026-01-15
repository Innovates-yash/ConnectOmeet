# Database Property Tests Dependencies

## Required Dependencies

Add these dependencies to your Maven `pom.xml` or Gradle `build.gradle`:

### Maven Dependencies
```xml
<dependencies>
    <!-- JQwik for property-based testing -->
    <dependency>
        <groupId>net.jqwik</groupId>
        <artifactId>jqwik</artifactId>
        <version>1.7.4</version>
        <scope>test</scope>
    </dependency>
    
    <!-- JUnit 5 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.9.2</version>
        <scope>test</scope>
    </dependency>
    
    <!-- H2 Database for testing -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <version>2.2.224</version>
        <scope>test</scope>
    </dependency>
    
    <!-- MySQL Connector (for production) -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>
</dependencies>
```

### Gradle Dependencies
```gradle
testImplementation 'net.jqwik:jqwik:1.7.4'
testImplementation 'org.junit.jupiter:junit-jupiter:5.9.2'
testImplementation 'com.h2database:h2:2.2.224'
implementation 'mysql:mysql-connector-java:8.0.33'
```

## Running the Tests

### Command Line
```bash
# Maven
mvn test -Dtest=DatabaseSchemaPropertyTests

# Gradle
./gradlew test --tests DatabaseSchemaPropertyTests
```

### IDE
- Import the project in your IDE
- Run the `DatabaseSchemaPropertyTests` class
- Individual property tests can be run separately

## Test Configuration

The tests use:
- **H2 in-memory database** with MySQL compatibility mode for fast testing
- **Property-based testing** with jqwik for comprehensive input coverage
- **100+ iterations** per property test for statistical confidence
- **Automatic test data generation** for realistic scenarios

## What the Tests Validate

1. **GameCoin Transaction Management** (Property 9)
   - Balance calculations remain accurate across multiple transactions
   - Negative balances are prevented
   - All transactions are properly logged
   - Transaction history maintains consistency

2. **Referential Integrity**
   - Foreign key constraints are enforced
   - Orphaned records are prevented
   - Cascade deletes work correctly

3. **Capacity Constraints**
   - Game sessions respect player limits
   - Room capacity is enforced
   - Concurrent access is handled properly

## Benefits of Property-Based Testing

- **Comprehensive Coverage**: Tests thousands of input combinations automatically
- **Edge Case Discovery**: Finds corner cases that manual tests might miss
- **Regression Prevention**: Ensures schema changes don't break existing functionality
- **Documentation**: Properties serve as executable specifications

These tests provide confidence that the database schema correctly implements the business rules and maintains data integrity under all conditions.