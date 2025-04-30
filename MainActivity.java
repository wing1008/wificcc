package com.example.cocodroneblock;

import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ClipDescription;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Point;
import android.os.Bundle;
import android.util.Log;
import android.view.DragEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.GravityCompat;
import androidx.core.view.WindowCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import com.google.android.material.navigation.NavigationView;

import java.util.Locale;

import android.app.AlertDialog;

public class MainActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {

    private DrawerLayout drawerLayout;
    private ImageButton hamburgerButton;
    private FrameLayout blockArea;
    private LinearLayout separateButtonContainer;
    private Button[] mainButtons;
    private LinearLayout[] subMenus;
    private NavigationView navView;
    private ScrollView blockScrollView;

    // 스냅 관련 상수
    private static final float SNAP_THRESHOLD = 300f;
    private static final float BLOCK_SPACING = -30f; // 블록 간 간격 (음수 값)
    private static final float SNAP_X_THRESHOLD = 200f; // X축 스냅 범위

    private View snapIndicator = null;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

        drawerLayout = findViewById(R.id.drawer_layout);
        navView = findViewById(R.id.nav_view);
        hamburgerButton = findViewById(R.id.hamburger_button);
        separateButtonContainer = findViewById(R.id.separate_button_container);
        blockArea = findViewById(R.id.block_area);
        blockScrollView = findViewById(R.id.block_scroll_view);

        hamburgerButton.bringToFront();
        hamburgerButton.setElevation(9999f);
        separateButtonContainer.bringToFront();
        separateButtonContainer.setElevation(9999f);

        setupBlockDropListener();

        findViewById(R.id.delete_button).setOnDragListener(this::onBlockTrashDrop);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (drawerLayout.isDrawerOpen(GravityCompat.END)) {
                    drawerLayout.closeDrawer(GravityCompat.END);
                } else {
                    setEnabled(false);
                    finish();
                }
            }
        });

        if (navView != null) {
            navView.setNavigationItemSelectedListener(this);
        }
        hamburgerButton.setOnClickListener(v -> drawerLayout.openDrawer(navView));
        setNavigationDrawerWidth();

        ImageView deleteButton = findViewById(R.id.delete_button);
        deleteButton.setOnClickListener(v -> {
            if (blockArea.getChildCount() > 0) {
                blockArea.removeViewAt(blockArea.getChildCount() - 1);
            } else {
                Toast.makeText(MainActivity.this, "삭제할 블록이 없습니다.", Toast.LENGTH_SHORT).show();
            }
        });

        drawerLayout.addDrawerListener(new DrawerLayout.DrawerListener() {
            @Override
            public void onDrawerClosed(@NonNull View drawerView) {
                Menu menu = navView.getMenu();
                menu.clear();
                getMenuInflater().inflate(R.menu.drawer_menu, menu);
            }

            @Override
            public void onDrawerSlide(@NonNull View drawerView, float slideOffset) {
            }

            @Override
            public void onDrawerOpened(@NonNull View drawerView) {
            }

            @Override
            public void onDrawerStateChanged(int newState) {
            }
        });

        mainButtons = new Button[]{
                findViewById(R.id.takeoff_button),
                findViewById(R.id.speed_button),
                findViewById(R.id.altitude_button),
                findViewById(R.id.move_button),
                findViewById(R.id.rotation_button),
                findViewById(R.id.flip_button),
                findViewById(R.id.setting_block)
        };
        subMenus = new LinearLayout[]{
                findViewById(R.id.takeoff_button_area),
                findViewById(R.id.speed_button_area),
                findViewById(R.id.altitude_button_area),
                findViewById(R.id.move_button_area),
                findViewById(R.id.rotation_button_area),
                findViewById(R.id.flip_button_area),
                findViewById(R.id.setting_button_area)
        };

        blockArea.post(() -> {
            Log.d("Debug", "blockArea left=" + blockArea.getLeft() +
                    ", top=" + blockArea.getTop() +
                    ", width=" + blockArea.getWidth());
        });

        setupSubMenuDeleteZone();

        for (int i = 0; i < mainButtons.length; i++) {
            final int idx = i;
            if (mainButtons[i] != null && subMenus[i] != null) {
                mainButtons[i].setOnClickListener(v -> toggleSubMenu(idx));
            }
        }

        createBlock("이륙", "takeoff", subMenus[0]);
        createBlock("착륙", "takeoff", subMenus[0]);
        createBlock("속도 증가", "speed", subMenus[1]);
        createBlock("고도 상승", "altitude", subMenus[2]);
        createBlock("고도 하강", "altitude", subMenus[2]);
        createBlock("호버링", "altitude", subMenus[2]);
        createBlock("앞으로 이동", "move", subMenus[3]);
        createBlock("뒤로 이동", "move", subMenus[3]);
        createBlock("오른쪽으로 이동", "move", subMenus[3]);
        createBlock("왼쪽으로 이동", "move", subMenus[3]);
        createBlock("우회전", "rotation", subMenus[4]);
        createBlock("좌회전", "rotation", subMenus[4]);
        createBlock("앞으로 플립", "flip", subMenus[5]);
        createBlock("뒤로 플립", "flip", subMenus[5]);
        createBlock("오른쪽으로 플립", "flip", subMenus[5]);
        createBlock("왼쪽으로 플립", "flip", subMenus[5]);
        createBlock("반복시작", "setting", subMenus[6]);
        createBlock("반복끝", "setting", subMenus[6]);
    }

    private void setNavigationDrawerWidth() {
        int screenWidth = getResources().getDisplayMetrics().widthPixels;
        int drawerWidth = screenWidth / 4;
        if (navView != null && navView.getLayoutParams() instanceof DrawerLayout.LayoutParams) {
            DrawerLayout.LayoutParams params = (DrawerLayout.LayoutParams) navView.getLayoutParams();
            params.width = drawerWidth;
            navView.setLayoutParams(params);
        }
    }

    private void createBlock(String text, String blockType, LinearLayout container) {
        BlockView block = new BlockView(this, null);
        block.setText(text);
        block.setBlockType(blockType);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(400, 150);
        params.setMargins(10, 10, 10, 10);
        block.setLayoutParams(params);

        container.addView(block);
        setupBlockDragListener(block);
    }

    private void toggleSubMenu(int index) {
        boolean isOpen = (subMenus[index].getVisibility() == View.VISIBLE);
        if (isOpen) {
            subMenus[index].setVisibility(View.GONE);
            separateButtonContainer.setVisibility(View.GONE); // 오타 수정
        } else {
            for (LinearLayout menu : subMenus) {
                if (menu != null) menu.setVisibility(View.GONE);
            }
            separateButtonContainer.setVisibility(View.VISIBLE);
            subMenus[index].setVisibility(View.VISIBLE);
            separateButtonContainer.bringToFront();
            separateButtonContainer.setElevation(9999f);
        }
    }

    private void setupBlockDropListener() {
        blockArea.setOnDragListener((v, event) -> {
            switch (event.getAction()) {
                case DragEvent.ACTION_DRAG_STARTED:
                    return event.getClipDescription().hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN);

                case DragEvent.ACTION_DRAG_LOCATION:
                    autoScrollIfNeeded(blockScrollView, event);
                    View draggedView = (View) event.getLocalState();
                    if (draggedView instanceof BlockView) {
                        updateSnapIndicatorForDrag((BlockView) draggedView, event.getX(), event.getY());
                    }
                    return true;

                case DragEvent.ACTION_DROP:
                    removeSnapIndicator();
                    View droppedView = (View) event.getLocalState();
                    if (droppedView instanceof BlockView) {
                        BlockView original = (BlockView) droppedView;
                        ViewGroup parent = (ViewGroup) original.getParent();

                        float dropX = event.getX();
                        float dropY = event.getY();
                        float[] convertedCoords = convertToBlockAreaCoords(dropX, dropY);

                        float finalX = convertedCoords[0] - original.getWidth() / 2f;
                        float finalY = convertedCoords[1] - original.getHeight() / 2f;

                        float fixedX = blockArea.getWidth() / 3f - original.getWidth() / 2f;
                        if (fixedX < 0) fixedX = 20;

                        BlockView targetBlock = (parent == blockArea) ? original : original.cloneBlock();
                        if (parent == blockArea) {
                            parent.removeView(original);
                        }

                        blockArea.addView(targetBlock);
                        targetBlock.setX(fixedX);
                        targetBlock.setY(finalY);
                        targetBlock.setVisibility(View.VISIBLE);

                        snapIfClose(targetBlock);
                        setupBlockDragListener(targetBlock);
                    }
                    return true;

                case DragEvent.ACTION_DRAG_ENDED:
                    removeSnapIndicator();
                    View view = (View) event.getLocalState();
                    if (view instanceof View && view.getVisibility() != View.VISIBLE) {
                        view.setVisibility(View.VISIBLE);
                    }
                    return true;

                default:
                    return false;
            }
        });
    }

    private void setupBlockDragListener(BlockView blockView) {
        blockView.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_DOWN && v instanceof BlockView) {
                v.performClick();
                if (v.getParent() == blockArea) {
                    ClipData data = ClipData.newPlainText("", "");
                    View.DragShadowBuilder shadowBuilder = new OffsetDragShadowBuilder(v, v.getWidth() / 2f, v.getHeight() / 2f);
                    v.startDragAndDrop(data, shadowBuilder, v, View.DRAG_FLAG_OPAQUE);
                    v.setVisibility(View.INVISIBLE);
                } else {
                    BlockView original = (BlockView) v;
                    BlockView clone = original.cloneBlock();
                    clone.setLayoutParams(new ViewGroup.LayoutParams(original.getWidth(), original.getHeight()));

                    clone.setX(-1000);
                    clone.setY(-1000);
                    blockArea.addView(clone);

                    clone.post(() -> {
                        ClipData data = ClipData.newPlainText("", "");
                        View.DragShadowBuilder shadowBuilder = new View.DragShadowBuilder(clone);
                        clone.startDragAndDrop(data, shadowBuilder, clone, View.DRAG_FLAG_OPAQUE);
                    });
                }
                return true;
            }
            return false;
        });
    }

    private void updateSnapIndicatorForDrag(BlockView draggedView, float dragX, float dragY) {
        float[] candidateCoords = convertToBlockAreaCoords(dragX, dragY);
        float candidateY = candidateCoords[1];
        float blockHeight = draggedView.getHeight();
        float blockWidth = draggedView.getWidth();

        float fixedX = blockArea.getWidth() / 3f - blockWidth / 2f;
        if (fixedX < 0) fixedX = 20;

        BlockView aboveBlock = null;
        BlockView belowBlock = null;
        BlockView middleBlock = null;
        float aboveDistance = Float.MAX_VALUE;
        float belowDistance = Float.MAX_VALUE;
        float middleDistance = Float.MAX_VALUE;

        final float DETECTION_THRESHOLD = SNAP_THRESHOLD * 1.5f;

        for (int i = 0; i < blockArea.getChildCount(); i++) {
            View child = blockArea.getChildAt(i);
            if (child == draggedView) continue;
            if (child instanceof BlockView) {
                BlockView otherBlock = (BlockView) child;
                float otherY = otherBlock.getY();
                float otherH = otherBlock.getHeight();
                float otherMiddleY = otherY + otherH / 2;

                float distBottomToTop = Math.abs(candidateY - (otherY + otherH));
                float distTopToBottom = Math.abs(otherY - (candidateY + blockHeight));
                float distToMiddle = Math.abs(candidateY + blockHeight / 2 - otherMiddleY);

                if (distBottomToTop < aboveDistance && distBottomToTop <= DETECTION_THRESHOLD) {
                    aboveDistance = distBottomToTop;
                    aboveBlock = otherBlock;
                }
                if (distTopToBottom < belowDistance && distTopToBottom <= DETECTION_THRESHOLD) {
                    belowDistance = distTopToBottom;
                    belowBlock = otherBlock;
                }
                if (distToMiddle < middleDistance && distToMiddle <= DETECTION_THRESHOLD / 1.5f) {
                    middleDistance = distToMiddle;
                    middleBlock = otherBlock;
                }
            }
        }

        float targetX = fixedX;
        float targetY = candidateY;
        boolean candidateFound = false;
        boolean snappingUpward = false;
        boolean snappingMiddle = false;

        if (middleBlock != null) {
            BlockView topOfMiddle = null;
            float minTopDistance = Float.MAX_VALUE;

            for (int i = 0; i < blockArea.getChildCount(); i++) {
                View child = blockArea.getChildAt(i);
                if (child == draggedView || child == middleBlock) continue;
                if (child instanceof BlockView) {
                    BlockView block = (BlockView) child;
                    float blockBottom = block.getY() + block.getHeight();
                    if (blockBottom <= middleBlock.getY() &&
                            (middleBlock.getY() - blockBottom) < minTopDistance) {
                        minTopDistance = middleBlock.getY() - blockBottom;
                        topOfMiddle = block;
                    }
                }
            }

            targetX = fixedX;
            if (topOfMiddle != null) {
                targetY = topOfMiddle.getY() + topOfMiddle.getHeight() + BLOCK_SPACING;
            } else {
                targetY = 10;
            }
            candidateFound = true;
            snappingMiddle = true;
        } else {
            float aboveY = aboveBlock != null ? aboveBlock.getY() + aboveBlock.getHeight() : Float.MAX_VALUE;
            float belowY = belowBlock != null ? belowBlock.getY() : Float.MAX_VALUE;

            float distToAbove = Math.abs(candidateY - aboveY);
            float distToBelow = Math.abs(candidateY + draggedView.getHeight() - belowY);

            if (aboveBlock != null && belowBlock != null) {
                if (distToAbove < distToBelow && isNotOccupied(aboveBlock, belowBlock)) {
                    targetX = fixedX;
                    targetY = aboveY + BLOCK_SPACING;
                    candidateFound = true;
                    snappingUpward = false;
                } else if (isNotOccupied(aboveBlock, belowBlock)) {
                    targetX = fixedX;
                    targetY = belowY - draggedView.getHeight() - BLOCK_SPACING;
                    candidateFound = true;
                    snappingUpward = true;
                }
            } else if (aboveBlock != null && isNotOccupied(aboveBlock, null)) {
                targetX = fixedX;
                targetY = aboveY + BLOCK_SPACING;
                candidateFound = true;
                snappingUpward = false;
            } else if (belowBlock != null && isNotOccupied(null, belowBlock)) {
                targetX = fixedX;
                targetY = belowY - draggedView.getHeight() - BLOCK_SPACING;
                candidateFound = true;
                snappingUpward = true;
            }
        }

        if (candidateFound) {
            showOrUpdateSnapIndicator(targetX, targetY, blockWidth, snappingUpward);
        } else {
            removeSnapIndicator();
        }
    }

    private boolean isNotOccupied(BlockView aboveBlock, BlockView belowBlock) {
        final float OCCUPATION_TOLERANCE = 40f;

        for (int i = 0; i < blockArea.getChildCount(); i++) {
            View child = blockArea.getChildAt(i);
            if (child instanceof BlockView) {
                BlockView block = (BlockView) child;
                if (block == aboveBlock || block == belowBlock) continue;

                if (aboveBlock != null) {
                    float expectedPos = aboveBlock.getY() + aboveBlock.getHeight() + BLOCK_SPACING;
                    if (Math.abs(block.getY() - expectedPos) < OCCUPATION_TOLERANCE) {
                        return false;
                    }
                }
                if (belowBlock != null) {
                    float expectedPos = belowBlock.getY() - block.getHeight() - BLOCK_SPACING;
                    if (Math.abs(block.getY() - expectedPos) < OCCUPATION_TOLERANCE) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    private void snapIfClose(BlockView newBlock) {
        float newY = newBlock.getY();
        float h = newBlock.getHeight();

        float fixedX = blockArea.getWidth() / 3f - newBlock.getWidth() / 2f;
        if (fixedX < 0) fixedX = 20;

        newBlock.setX(fixedX);

        BlockView closestAbove = null;
        BlockView closestBelow = null;
        BlockView closestMiddle = null;
        float minAboveDistance = Float.MAX_VALUE;
        float minBelowDistance = Float.MAX_VALUE;
        float minMiddleDistance = Float.MAX_VALUE;

        final float EXTENDED_SNAP_THRESHOLD = SNAP_THRESHOLD * 1.5f;

        for (int i = 0; i < blockArea.getChildCount(); i++) {
            View child = blockArea.getChildAt(i);
            if (child == newBlock) continue;
            if (child instanceof BlockView) {
                BlockView other = (BlockView) child;
                float otherY = other.getY();
                float otherH = other.getHeight();
                float otherMiddleY = otherY + otherH / 2;

                float distBottomToTop = Math.abs(newY - (otherY + otherH));
                float distTopToBottom = Math.abs((newY + h) - otherY);
                float distToMiddle = Math.abs((newY + h / 2) - otherMiddleY);

                if (distBottomToTop < minAboveDistance && distBottomToTop <= EXTENDED_SNAP_THRESHOLD) {
                    minAboveDistance = distBottomToTop;
                    closestAbove = other;
                }
                if (distTopToBottom < minBelowDistance && distTopToBottom <= EXTENDED_SNAP_THRESHOLD) {
                    minBelowDistance = distTopToBottom;
                    closestBelow = other;
                }
                if (distToMiddle < minMiddleDistance && distToMiddle <= EXTENDED_SNAP_THRESHOLD / 1.5f) {
                    minMiddleDistance = distToMiddle;
                    closestMiddle = other;
                }
            }
        }

        if (closestMiddle != null) {
            BlockView blockAbove = null;
            float minAbove = Float.MAX_VALUE;

            for (int i = 0; i < blockArea.getChildCount(); i++) {
                View child = blockArea.getChildAt(i);
                if (child == newBlock || !(child instanceof BlockView)) continue;

                BlockView other = (BlockView) child;
                float blockBottom = other.getY() + other.getHeight();
                if (blockBottom <= closestMiddle.getY() &&
                        (closestMiddle.getY() - blockBottom) < minAbove) {
                    minAbove = closestMiddle.getY() - blockBottom;
                    blockAbove = other;
                }
            }

            newBlock.setX(fixedX);
            if (blockAbove != null) {
                newBlock.setY(blockAbove.getY() + blockAbove.getHeight() + BLOCK_SPACING);
                float fromY = newBlock.getY(); // 현재 삽입되는 블록의 위치
                shiftBlocksFromPosition(newBlock, fromY);
            } else {
                newBlock.setY(10);
                shiftBlocksFromPosition(newBlock, 10 + newBlock.getHeight() + BLOCK_SPACING);
            }
            return;
        }

        if (closestAbove != null && closestBelow != null) {
            if (isNotOccupied(closestAbove, closestBelow)) {
                newBlock.setX(fixedX);
                newBlock.setY(closestAbove.getY() + closestAbove.getHeight() + BLOCK_SPACING);
                shiftBlocksDown(closestBelow);
                return;
            }
        }

        if (closestAbove != null && isNotOccupied(closestAbove, null)) {
            newBlock.setX(fixedX);
            newBlock.setY(closestAbove.getY() + closestAbove.getHeight() + BLOCK_SPACING);
            return;
        }

        if (closestBelow != null && isNotOccupied(null, closestBelow)) {
            newBlock.setX(fixedX);
            newBlock.setY(closestBelow.getY() - h - BLOCK_SPACING);
        } else {
            newBlock.setX(fixedX);
        }
    }

    private void shiftBlocksFromPosition(BlockView newBlock, float fromY) {
        float shiftAmount = newBlock.getHeight() + BLOCK_SPACING;
        float baseX = newBlock.getX();

        for (int i = 0; i < blockArea.getChildCount(); i++) {
            View child = blockArea.getChildAt(i);
            if (child instanceof BlockView && child != newBlock) {
                BlockView block = (BlockView) child;
                if (block.getY() >= fromY && Math.abs(block.getX() - baseX) <= SNAP_X_THRESHOLD) {
                    block.setY(block.getY() + shiftAmount);
                }
            }
        }
    }

    private void shiftBlocksDown(BlockView startBlock) {
        float shiftY = startBlock.getHeight() + BLOCK_SPACING;
        float baseY = startBlock.getY();

        for (int i = 0; i < blockArea.getChildCount(); i++) {
            View child = blockArea.getChildAt(i);
            if (child instanceof BlockView && child != startBlock) {
                BlockView block = (BlockView) child;
                if (block.getY() >= baseY) {
                    block.setY(block.getY() + shiftY);
                }
            }
        }
    }

    private float[] convertToBlockAreaCoords(float x, float y) {
        int[] blockAreaLocation = new int[2];
        blockArea.getLocationOnScreen(blockAreaLocation);
        float convertedX = x - blockAreaLocation[0];
        float convertedY = y - blockAreaLocation[1] + blockScrollView.getScrollY();
        return new float[]{convertedX, convertedY};
    }

    private boolean isInSubMenu(View parent) {
        for (LinearLayout sub : subMenus) {
            if (sub == parent) return true;
        }
        return false;
    }

    private void autoScrollIfNeeded(ScrollView scrollView, DragEvent event) {
        final int SCROLL_THRESHOLD = 100;
        final int SCROLL_SPEED = 10;
        float y = event.getY();
        int scrollY = scrollView.getScrollY();
        int height = scrollView.getHeight();
        if (y - scrollY < SCROLL_THRESHOLD) {
            scrollView.scrollBy(0, -SCROLL_SPEED);
        } else if ((scrollY + height) - y < SCROLL_THRESHOLD) {
            scrollView.scrollBy(0, SCROLL_SPEED);
        }
    }

    private boolean onBlockTrashDrop(View v, DragEvent event) {
        if (event.getAction() == DragEvent.ACTION_DROP) {
            View draggedView = (View) event.getLocalState();
            if (draggedView != null) {
                ((ViewGroup) draggedView.getParent()).removeView(draggedView);
            }
        }
        return true;
    }

    private void setupSubMenuDeleteZone() {
        for (LinearLayout sub : subMenus) {
            sub.setOnDragListener((v, event) -> {
                switch (event.getAction()) {
                    case DragEvent.ACTION_DRAG_STARTED:
                        return event.getClipDescription().hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN);
                    case DragEvent.ACTION_DRAG_ENTERED:
                        v.setBackgroundColor(0x44FF0000);
                        return true;
                    case DragEvent.ACTION_DRAG_EXITED:
                        v.setBackgroundColor(Color.TRANSPARENT);
                        return true;
                    case DragEvent.ACTION_DROP:
                        View draggedView = (View) event.getLocalState();
                        if (draggedView != null) {
                            ViewGroup parent = (ViewGroup) draggedView.getParent();
                            if (parent != null) {
                                parent.removeView(draggedView);
                            }
                        }
                        v.setBackgroundColor(Color.TRANSPARENT);
                        return true;
                    case DragEvent.ACTION_DRAG_ENDED:
                        v.setBackgroundColor(Color.TRANSPARENT);
                        return true;
                }
                return false;
            });
        }
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        int itemId = item.getItemId();
        if (itemId == R.id.nav_settings) {
            showLanguageDialog();
            return false;
        } else if (itemId == R.id.nav_virtual_controller) {
            openVirtualController();
        } else if (itemId == R.id.nav_gyro_reset) {
            resetGyro();
        } else if (itemId == R.id.nav_save) {
            saveData();
        } else if (itemId == R.id.nav_load) {
            loadData();
        }
        return true;
    }

    private void showLanguageDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("언어 설정");
        String[] languages = {"한국어", "English"};
        builder.setItems(languages, (dialog, which) -> {
            if (which == 0) {
                changeLanguage("ko");
            } else if (which == 1) {
                changeLanguage("en");
            }
            dialog.dismiss();
        });
        builder.setNegativeButton("취소", (dialog, which) -> dialog.dismiss());
        builder.create().show();
    }

    private void changeLanguage(String languageCode) {
        SharedPreferences.Editor editor = getSharedPreferences("AppSettings", MODE_PRIVATE).edit();
        editor.putString("language", languageCode);
        editor.apply();

        Locale locale = new Locale(languageCode);
        Locale.setDefault(locale);
        Configuration config = new Configuration();
        config.setLocale(locale);

        Context newContext = createConfigurationContext(config);
        recreate();
    }

    private void openVirtualController() {
        Intent intent = new Intent(this, VirtualControllerActivity.class);
        startActivity(intent);
    }

    private void resetGyro() {
        Toast.makeText(this, "자이로 초기화 실행됨", Toast.LENGTH_SHORT).show();
        Log.d("Gyro", "자이로 초기화가 정상적으로 실행되었습니다.");
    }

    private void saveData() {
        Toast.makeText(this, "데이터 저장 완료", Toast.LENGTH_SHORT).show();
        Log.d("SaveData", "데이터 저장 완료");
    }

    private void loadData() {
        Toast.makeText(this, "데이터 불러오기 완료", Toast.LENGTH_SHORT).show();
        Log.d("LoadData", "데이터 불러오기 완료");
    }

    private static class OffsetDragShadowBuilder extends View.DragShadowBuilder {
        private final float offsetX;
        private final float offsetY;

        public OffsetDragShadowBuilder(View view, float offsetX, float offsetY) {
            super(view);
            this.offsetX = offsetX;
            this.offsetY = offsetY;
        }

        @Override
        public void onProvideShadowMetrics(Point outSize, Point outTouchPoint) {
            outSize.set(getView().getWidth(), getView().getHeight());
            outTouchPoint.set((int) offsetX, (int) offsetY);
        }
    }

    // 1. 스냅 인디케이터 표시/업데이트 메서드
    private void showOrUpdateSnapIndicator(float targetX, float targetY, float width, boolean snappingUpward) {
        if (snapIndicator == null) {
            // 스냅 인디케이터 생성 (빨간색 선)
            snapIndicator = new View(this);
            snapIndicator.setBackgroundColor(Color.RED);
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    (int) width, 6);  // 6픽셀 두께의 선
            snapIndicator.setLayoutParams(params);
            blockArea.addView(snapIndicator);
        }

        // 인디케이터 위치 업데이트
        snapIndicator.setX(targetX);

        // 상단/하단 위치 결정
        if (snappingUpward) {
            // 블록 상단에 표시
            snapIndicator.setY(targetY - 3);
        } else {
            // 블록 하단에 표시
            snapIndicator.setY(targetY + 3);
        }

        // 확실하게 보이도록
        snapIndicator.setVisibility(View.VISIBLE);
        snapIndicator.bringToFront();
    }

    // 2. 스냅 인디케이터 제거 메서드
    private void removeSnapIndicator() {
        if (snapIndicator != null) {
            blockArea.removeView(snapIndicator);
            snapIndicator = null;
        }
    }
}