Feature: Biodiversity

  Scenario: Visitor reviews biodiversity predictions
    Given the fixture project page is open on the biodiversity predictions view
    Then the biodiversity predictions panel is visible
    And the predictions entry "Plants" is visible
    And the predictions entry "Animals" is visible
    When the visitor opens the "Plants" predictions gallery
    Then the predictions gallery shows "Predicted Native Trees"

  Scenario: Visitor reviews biodiversity observations
    Given the fixture project page is open on the biodiversity observations view
    Then the measured trees panel is visible
    And the measured tree group "Acacia tortilis" is visible
    When the visitor changes the measured tree filter to "Height"
    Then the measured tree group "10-20m" is visible
