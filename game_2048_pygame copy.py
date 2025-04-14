import pygame
import numpy as np
import random

# 初始化Pygame环境
pygame.init()

# 游戏窗口和网格的基本配置
WINDOW_SIZE = 400  # 游戏窗口的大小（像素）
GRID_SIZE = 4      # 游戏网格的大小（4x4）
CELL_SIZE = WINDOW_SIZE // GRID_SIZE  # 每个格子的大小
PADDING = 10       # 格子之间的间距

# 游戏中不同数字对应的颜色配置（RGB值）
COLORS = {
    0: (205, 193, 180),    # 空格子的颜色
    2: (238, 228, 218),     # 数字2的颜色
    4: (237, 224, 200),     # 数字4的颜色
    8: (242, 177, 121),     # 数字8的颜色
    16: (245, 149, 99),     # 数字16的颜色
    32: (246, 124, 95),     # 数字32的颜色
    64: (246, 94, 59),      # 数字64的颜色
    128: (237, 207, 114),   # 数字128的颜色
    256: (237, 204, 97),    # 数字256的颜色
    512: (237, 200, 80),    # 数字512的颜色
    1024: (237, 197, 63),   # 数字1024的颜色
    2048: (237, 194, 46)    # 数字2048的颜色
}

# 游戏界面的其他颜色配置
BG_COLOR = (187, 173, 160)    # 游戏背景色
TEXT_COLOR = (119, 110, 101)  # 文字颜色

# 初始化游戏窗口
screen = pygame.display.set_mode((WINDOW_SIZE, WINDOW_SIZE + 60))  # 窗口大小，底部额外60像素显示状态
pygame.display.set_caption('2048')  # 设置窗口标题

def init_board():
    """初始化游戏面板
    创建一个4x4的空面板，并随机添加两个初始数字
    返回：numpy数组形式的游戏面板
    """
    board = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)
    add_new_tile(board)
    add_new_tile(board)
    return board

def add_new_tile(board):
    """在空位置随机添加一个新的数字（2或4）
    参数：
        board: 游戏面板的numpy数组
    """
    empty_cells = [(i, j) for i in range(GRID_SIZE) for j in range(GRID_SIZE) if board[i][j] == 0]
    if empty_cells:
        i, j = random.choice(empty_cells)
        board[i][j] = 2 if random.random() < 0.9 else 4  # 90%概率生成2，10%概率生成4

def merge(row):
    """合并一行中相邻的相同数字
    参数：
        row: 要处理的行（numpy数组）
    返回：
        合并后的行
    """
    # 移除所有的0，并保留非零数字
    row = row[row != 0]
    # 从左到右合并相邻的相同数字
    for i in range(len(row)-1):
        if row[i] == row[i+1]:
            row[i] *= 2
            row[i+1] = 0
    # 再次移除所有的0
    row = row[row != 0]
    # 用0填充到原始长度
    return np.pad(row, (0, GRID_SIZE-len(row)), 'constant')

def move(board, direction):
    """移动面板中的数字
    参数：
        board: 游戏面板
        direction: 移动方向（0:左, 1:上, 2:右, 3:下）
    返回：
        移动后的面板和是否发生移动的标志
    """
    # 根据方向旋转面板
    rotated_board = np.rot90(board, direction)
    moved = False
    # 处理每一行
    for i in range(GRID_SIZE):
        original = rotated_board[i].copy()
        rotated_board[i] = merge(rotated_board[i])
        if not np.array_equal(original, rotated_board[i]):
            moved = True
    # 旋转回原来的方向
    return np.rot90(rotated_board, -direction), moved

def is_game_over(board):
    """检查游戏是否结束
    参数：
        board: 游戏面板
    返回：
        如果无法继续移动则返回True，否则返回False
    """
    # 检查是否还有空格子
    if 0 in board:
        return False
    # 检查是否有相邻的相同数字
    for i in range(GRID_SIZE):
        for j in range(GRID_SIZE-1):
            if board[i][j] == board[i][j+1] or board[j][i] == board[j+1][i]:
                return False
    return True

def draw_board(board):
    """绘制游戏界面
    参数：
        board: 游戏面板
    """
    # 设置整体背景色
    screen.fill((250, 248, 239))
    # 绘制游戏区域背景
    pygame.draw.rect(screen, BG_COLOR, (0, 0, WINDOW_SIZE, WINDOW_SIZE))
    
    # 绘制每个格子
    for i in range(GRID_SIZE):
        for j in range(GRID_SIZE):
            value = board[i][j]
            # 计算格子的位置和大小
            cell_rect = pygame.Rect(
                j * CELL_SIZE + PADDING,
                i * CELL_SIZE + PADDING,
                CELL_SIZE - 2 * PADDING,
                CELL_SIZE - 2 * PADDING
            )
            # 绘制格子背景
            pygame.draw.rect(screen, COLORS[value], cell_rect, border_radius=5)
            
            # 如果格子中有数字，绘制数字
            if value != 0:
                # 根据数字的位数调整字体大小
                font_size = 48 if value < 100 else 36 if value < 1000 else 24
                font = pygame.font.Font(None, font_size)
                text = font.render(str(value), True, TEXT_COLOR)
                text_rect = text.get_rect(center=cell_rect.center)
                screen.blit(text, text_rect)
    
    # 显示游戏状态
    status_font = pygame.font.Font(None, 36)
    status_rect = pygame.Rect(0, WINDOW_SIZE, WINDOW_SIZE, 60)
    pygame.draw.rect(screen, (250, 248, 239), status_rect)
    
    # 根据游戏状态显示不同的提示文本
    if 2048 in board:
        status_text = status_font.render('恭喜获胜！', True, TEXT_COLOR)
    elif is_game_over(board):
        status_text = status_font.render('游戏结束！', True, TEXT_COLOR)
    else:
        status_text = status_font.render('使用方向键移动，ESC退出', True, TEXT_COLOR)
    
    # 将状态文本绘制到屏幕底部
    status_rect = status_text.get_rect(center=(WINDOW_SIZE//2, WINDOW_SIZE + 30))
    screen.blit(status_text, status_rect)
    
    # 更新显示
    pygame.display.flip()

def main():
    """游戏主循环"""
    # 初始化游戏面板
    board = init_board()
    running = True
    
    # 主游戏循环
    while running:
        # 绘制当前游戏状态
        draw_board(board)
        
        # 处理游戏事件
        for event in pygame.event.get():
            if event.type == pygame.QUIT:  # 点击关闭窗口
                running = False
            elif event.type == pygame.KEYDOWN:  # 键盘按下事件
                moved = False
                if event.key == pygame.K_ESCAPE:  # ESC键退出
                    running = False
                elif event.key == pygame.K_UP:    # 向上移动
                    board, moved = move(board, 1)
                elif event.key == pygame.K_DOWN:  # 向下移动
                    board, moved = move(board, 3)
                elif event.key == pygame.K_LEFT:  # 向左移动
                    board, moved = move(board, 0)
                elif event.key == pygame.K_RIGHT: # 向右移动
                    board, moved = move(board, 2)
                
                # 如果发生了有效移动，添加新的数字
                if moved:
                    add_new_tile(board)
                
                # 检查游戏是否结束
                if 2048 in board or is_game_over(board):
                    pygame.time.wait(2000)  # 等待2秒显示结果
                    running = False
    
    # 退出游戏
    pygame.quit()

if __name__ == '__main__':
    main()