# Key.py
from pygame.locals import K_ESCAPE, K_SPACE, K_UP, K_LEFT, K_RIGHT, K_x, K_z, K_q, K_m, K_p

Key_Move_Forward = K_UP       # Moving forward 
Key_Move_Backward = K_UP      # Moving backward 
Key_Move_Left = K_LEFT        # Moving to the left 
Key_Move_Right = K_RIGHT      # Moving to the right 
Key_Move_Stop = K_SPACE       # Syop the car + Set the speed to 0 Km/h 
Key_ESC = K_ESCAPE            # End Simulation 

Key_Inc_Speed = K_z           # Increment the speed by Inc_Speed at confic file
Key_Dec_Speed = K_x           # Decrement the speed by Inc_Speed at confic file

Key_Toggle_View = K_q         # View of the camera
Key_Toggle_Driction = K_m     # Forward / Backword
Key_Toggle_Control = K_p      # Toggle autopilot / manual control
