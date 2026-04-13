Feature: Homepage shell

  Scenario: Visitor sees the globe homepage shell
    Given the application is reachable
    When the visitor opens the homepage
    Then the map shell is visible
    And the search overlay is visible
    And the overlay tabs are visible
