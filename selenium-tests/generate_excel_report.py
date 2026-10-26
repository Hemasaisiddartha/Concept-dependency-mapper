"""
Quick runner for generating the Selenium Test Cases Excel report (300 cases)
Can be executed directly from inside the selenium-tests folder:
    python generate_excel_report.py
"""

import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from generate_selenium_excel import build_selenium_excel

if __name__ == "__main__":
    build_selenium_excel()
