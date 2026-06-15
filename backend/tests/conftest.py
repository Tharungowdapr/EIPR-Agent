import os
import pytest

db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "eipr_agent.db")
if os.path.exists(db_path):
    os.remove(db_path)
