Feature: Search projects

  Scenario: Visitor filters projects and opens a project
    Given the homepage is open
    When the visitor searches for "Kenya"
    Then the project result "Acacia Conservation Reserve" is visible
    And the project result "Atlantic Mangrove Alliance" is not visible
    When the visitor opens the fixture project from search
    Then the fixture project overlay is visible
    And the project title is "Acacia Conservation Reserve"
