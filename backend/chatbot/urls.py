from django.urls import path
from . import views

urlpatterns = [
    path('checkAuth/', views.checkAuth),
    path('postchat/', views.post_chat),
    path('postchat/<str:chat_id>/', views.continue_chat),
    path('getchat/', views.get_chats),
    path('getuserchats/', views.get_user_chats),
]
