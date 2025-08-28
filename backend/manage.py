#!/usr/bin/env python
import os
import sys
from django.core.management import execute_from_command_line
from chatbot.database import ensure_tables
from chatbot.utils import scrape_links, clean_json_to_txt

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    if len(sys.argv) > 1 and sys.argv[1] == 'runserver':
        ensure_tables()
        print("Starting NGMC Chatbot Server...")
        print("MongoDB initialized successfully!")
        
        scrape_links()
        clean_json_to_txt("ngmc_college_links.json","links.txt")
    
    execute_from_command_line(sys.argv)
