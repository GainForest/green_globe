Feature: Community

  Scenario: Visitor reviews the community tab
    Given the fixture project page is open on the community view
    Then the community panel shows 2 member cards
    And the community member "Jane Wanjiru" is visible
