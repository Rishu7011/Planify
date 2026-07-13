import sys
import os

# Add the app/agent directory to sys.path so we can import modules correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from router import route_after_project_workflow, REPORT_GENERATOR_NODE
from langgraph.graph import END

def test_route_after_project_workflow_general_no_action():
    state = {
        "metadata": {
            "next_workflows": ["NO_ACTION"],
            "discovery_complete": False,
            "project_action": "NEW_PROJECT"
        }
    }
    assert route_after_project_workflow(state) == END

def test_route_after_project_workflow_discovery_incomplete_report_blocked():
    state = {
        "metadata": {
            "next_workflows": ["PRD"],
            "discovery_complete": False,
            "project_action": "CONTINUE_PROJECT"
        }
    }
    # Should block report generator and end
    assert route_after_project_workflow(state) == END

def test_route_after_project_workflow_discovery_complete_report_allowed():
    state = {
        "metadata": {
            "next_workflows": ["PRD"],
            "discovery_complete": True,
            "project_action": "CONTINUE_PROJECT"
        }
    }
    # Should allow report generator
    assert route_after_project_workflow(state) == REPORT_GENERATOR_NODE

def test_route_after_project_workflow_user_requested_report_allowed_even_if_discovery_incomplete():
    state = {
        "metadata": {
            "next_workflows": ["PRD"],
            "discovery_complete": False,
            "project_action": "REPORT_REQUEST"
        }
    }
    # Explicit request allows it even if discovery_complete is False
    assert route_after_project_workflow(state) == REPORT_GENERATOR_NODE


if __name__ == "__main__":
    test_route_after_conversation_understanding = None
    # Run tests
    test_route_after_project_workflow_general_no_action()
    test_route_after_project_workflow_discovery_incomplete_report_blocked()
    test_route_after_project_workflow_discovery_complete_report_allowed()
    test_route_after_project_workflow_user_requested_report_allowed_even_if_discovery_incomplete()
    print("All router tests passed successfully!")
