Feature: Project info

  Scenario: Visitor reviews project info and switches project sites
    Given the fixture project page is open on the project info view
    Then the project description contains "Acacia Conservation restores dryland forest mosaics"
    And the project site selector shows "Main Restoration Site"
    When the visitor switches the project site to "Community Nursery Site"
    Then the project site selector shows "Community Nursery Site"
