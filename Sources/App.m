#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#include <sys/file.h>
#include <fcntl.h>

@interface WidgetWindow : NSWindow @end
@implementation WidgetWindow
- (BOOL)canBecomeKeyWindow { return YES; }
- (BOOL)canBecomeMainWindow { return YES; }
@end
@interface DragHandle : NSView @end
@implementation DragHandle
- (void)mouseDown:(NSEvent *)event { [self.window performWindowDragWithEvent:event]; }
@end

@interface AppDelegate : NSObject <NSApplicationDelegate,WKScriptMessageHandler,WKNavigationDelegate,WKUIDelegate,NSWindowDelegate>
@property NSWindow *window;
@property WKWebView *web;
@property NSStatusItem *status;
@property NSURL *dataURL;
@property BOOL pinned;
@property int instanceLock;
@end
@implementation AppDelegate
- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    NSMenu *mainMenu=[NSMenu new];NSMenuItem *applicationItem=[NSMenuItem new];
    [mainMenu addItem:applicationItem];NSMenu *applicationMenu=[NSMenu new];
    NSMenuItem *hideItem=[applicationMenu addItemWithTitle:@"收起到菜单栏" action:@selector(hide:) keyEquivalent:@"w"];hideItem.target=self;
    NSMenuItem *quitItem=[applicationMenu addItemWithTitle:@"退出小小奇遇" action:@selector(quit:) keyEquivalent:@"q"];quitItem.target=self;
    applicationItem.submenu=applicationMenu;NSApp.mainMenu=mainMenu;
    NSArray *args=NSProcessInfo.processInfo.arguments;
    NSUInteger index=[args indexOfObject:@"--data-dir"];
    NSString *dir=index!=NSNotFound && args.count>index+1 ? args[index+1] : [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Application Support/LittleWonders"];
    self.dataURL=[[NSURL fileURLWithPath:dir] URLByAppendingPathComponent:@"state.json"];
    [NSFileManager.defaultManager createDirectoryAtPath:dir withIntermediateDirectories:YES attributes:@{NSFilePosixPermissions:@0700} error:nil];
    self.instanceLock=open([[dir stringByAppendingPathComponent:@".instance.lock"] fileSystemRepresentation],O_CREAT|O_RDWR,0600);
    if(self.instanceLock>=0 && flock(self.instanceLock,LOCK_EX|LOCK_NB)!=0){
        [NSDistributedNotificationCenter.defaultCenter postNotificationName:@"local.littlewonders.reopen" object:dir];exit(0);
    }
    [NSDistributedNotificationCenter.defaultCenter addObserver:self selector:@selector(show:) name:@"local.littlewonders.reopen" object:dir];
    WKUserContentController *controller=[WKUserContentController new];
    [controller addScriptMessageHandler:self name:@"app"];
    NSString *initial=@"{}"; BOOL loadError=NO; self.pinned=YES;
    NSData *data=[NSData dataWithContentsOfURL:self.dataURL];
    if(data){
        id object=[NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        if([object isKindOfClass:NSDictionary.class]){
            initial=[[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:object options:0 error:nil] encoding:NSUTF8StringEncoding];
            id settings=object[@"settings"];
            if([settings isKindOfClass:NSDictionary.class] && [settings[@"pinned"] isKindOfClass:NSNumber.class]) self.pinned=[settings[@"pinned"] boolValue];
        }else{
            loadError=YES;
            NSURL *backup=[[self.dataURL URLByDeletingLastPathComponent] URLByAppendingPathComponent:[NSString stringWithFormat:@"state-unreadable-%.0f.json",NSDate.date.timeIntervalSince1970]];
            [NSFileManager.defaultManager copyItemAtURL:self.dataURL toURL:backup error:nil];
        }
    }
    NSString *script=[NSString stringWithFormat:@"window.__INITIAL_STATE__=%@;window.__LOAD_ERROR__=%@;",initial,loadError?@"true":@"false"];
    [controller addUserScript:[[WKUserScript alloc] initWithSource:script injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES]];
    WKWebViewConfiguration *config=[WKWebViewConfiguration new];config.userContentController=controller;
    self.web=[[WKWebView alloc] initWithFrame:NSZeroRect configuration:config];self.web.navigationDelegate=self;self.web.UIDelegate=self;
    [self.web setValue:@NO forKey:@"drawsBackground"];
    NSRect screen=NSScreen.mainScreen.visibleFrame;
    CGFloat width=390,height=MIN(790,screen.size.height-40);
    self.window=[[WidgetWindow alloc] initWithContentRect:NSMakeRect(NSMaxX(screen)-width-24,NSMaxY(screen)-height-20,width,height) styleMask:NSWindowStyleMaskBorderless backing:NSBackingStoreBuffered defer:NO];
    self.window.delegate=self;self.window.title=@"小小奇遇";self.window.backgroundColor=NSColor.clearColor;self.window.opaque=NO;self.window.hasShadow=YES;self.window.releasedWhenClosed=NO;
    self.window.collectionBehavior=NSWindowCollectionBehaviorCanJoinAllSpaces|NSWindowCollectionBehaviorFullScreenAuxiliary;
    NSView *container=[[NSView alloc] initWithFrame:NSMakeRect(0,0,width,height)];
    self.web.frame=container.bounds;self.web.autoresizingMask=NSViewWidthSizable|NSViewHeightSizable;
    [container addSubview:self.web];
    DragHandle *handle=[[DragHandle alloc] initWithFrame:NSMakeRect(0,height-45,width-105,45)];handle.autoresizingMask=NSViewWidthSizable|NSViewMinYMargin;
    [container addSubview:handle];self.window.contentView=container;
    self.web.wantsLayer=YES;self.web.layer.cornerRadius=22;self.web.layer.masksToBounds=YES;
    [self.window setFrameAutosaveName:@"LittleWondersWindow"];
    [self.window setContentSize:NSMakeSize(width,height)];
    BOOL reachable=NO;for(NSScreen *s in NSScreen.screens)if(NSIntersectsRect(s.visibleFrame,self.window.frame))reachable=YES;
    if(!reachable)[self.window setFrameOrigin:NSMakePoint(NSMaxX(screen)-width-24,NSMaxY(screen)-height-20)];
    [self applyPin];
    NSURL *resources=NSBundle.mainBundle.resourceURL;
    [self.web loadFileURL:[resources URLByAppendingPathComponent:@"index.html"] allowingReadAccessToURL:resources];
    [self buildMenu];[self show:nil];
    [NSWorkspace.sharedWorkspace.notificationCenter addObserver:self selector:@selector(wake:) name:NSWorkspaceDidWakeNotification object:nil];
    [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(wake:) name:NSCalendarDayChangedNotification object:nil];
}
- (void)buildMenu {
    self.status=[NSStatusBar.systemStatusBar statusItemWithLength:NSVariableStatusItemLength];self.status.button.title=@"🐰";self.status.button.toolTip=@"小小奇遇 · 今天也和世界玩一下";
    NSMenu *menu=[NSMenu new];
    [menu addItemWithTitle:@"打开小小奇遇" action:@selector(show:) keyEquivalent:@""];
    [menu addItemWithTitle:@"收起到菜单栏" action:@selector(hide:) keyEquivalent:@""];
    [menu addItem:NSMenuItem.separatorItem];
    NSMenuItem *pin=[menu addItemWithTitle:@"保持置顶" action:@selector(togglePin:) keyEquivalent:@""];pin.tag=7;pin.state=self.pinned?NSControlStateValueOn:NSControlStateValueOff;
    [menu addItemWithTitle:@"查看使用说明" action:@selector(about:) keyEquivalent:@""];
    [menu addItem:NSMenuItem.separatorItem];
    [menu addItemWithTitle:@"退出小小奇遇" action:@selector(quit:) keyEquivalent:@"q"];
    for(NSMenuItem *item in menu.itemArray)item.target=self;self.status.menu=menu;
}
- (void)applyPin {self.window.level=self.pinned?NSFloatingWindowLevel:NSNormalWindowLevel;[self.status.menu itemWithTag:7].state=self.pinned?NSControlStateValueOn:NSControlStateValueOff;}
- (void)show:(id)sender {[NSApp activateIgnoringOtherApps:YES];[self.window makeKeyAndOrderFront:nil];[self wake:nil];}
- (void)hide:(id)sender {[self.window orderOut:nil];}
- (void)quit:(id)sender {[NSApp terminate:nil];}
- (void)wake:(id)sender {[self.web evaluateJavaScript:@"window.refreshDay?.()" completionHandler:nil];}
- (void)about:(id)sender {[self show:nil];[self.web evaluateJavaScript:@"document.querySelector('#about-dialog').showModal()" completionHandler:nil];}
- (void)togglePin:(id)sender {[self.web evaluateJavaScript:@"document.querySelector('#pin').click()" completionHandler:nil];}
- (BOOL)applicationShouldHandleReopen:(NSApplication *)app hasVisibleWindows:(BOOL)flag {[self show:nil];return YES;}
- (void)userContentController:(WKUserContentController *)controller didReceiveScriptMessage:(WKScriptMessage *)message {
    if(!message.frameInfo.mainFrame || ![message.body isKindOfClass:NSDictionary.class])return;
    NSDictionary *body=message.body;NSString *type=body[@"type"];
    if([type isEqual:@"save"]){
        id state=body[@"state"];if(![state isKindOfClass:NSDictionary.class] || ![NSJSONSerialization isValidJSONObject:state])return;
        NSError *error=nil;NSData *data=[NSJSONSerialization dataWithJSONObject:state options:NSJSONWritingPrettyPrinted|NSJSONWritingSortedKeys error:&error];
        if(data && !error)[NSFileManager.defaultManager createDirectoryAtURL:[self.dataURL URLByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:@{NSFilePosixPermissions:@0700} error:&error];
        BOOL ok=data && !error && [data writeToURL:self.dataURL options:NSDataWritingAtomic error:&error];
        if(ok)[NSFileManager.defaultManager setAttributes:@{NSFilePosixPermissions:@0600} ofItemAtPath:self.dataURL.path error:nil];
        [self.web evaluateJavaScript:ok?@"window.saveResult?.(true)":@"window.saveResult?.(false)" completionHandler:nil];
    }else if([type isEqual:@"pin"]){self.pinned=[body[@"pinned"] boolValue];[self applyPin];}
    else if([type isEqual:@"hide"])[self hide:nil];
}
- (void)webView:(WKWebView *)web decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))handler {
    NSURL *url=action.request.URL;
    if(url.isFileURL)handler(WKNavigationActionPolicyAllow);
    else {if([url.scheme isEqual:@"https"])[NSWorkspace.sharedWorkspace openURL:url];handler(WKNavigationActionPolicyCancel);}
}
- (WKWebView *)webView:(WKWebView *)web createWebViewWithConfiguration:(WKWebViewConfiguration *)config forNavigationAction:(WKNavigationAction *)action windowFeatures:(WKWindowFeatures *)features {
    if(action.sourceFrame.mainFrame && [action.request.URL.scheme isEqual:@"https"])[NSWorkspace.sharedWorkspace openURL:action.request.URL];return nil;
}
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)web {
    // Recover using the current saved state rather than a stale startup snapshot.
    NSData *data=[NSData dataWithContentsOfURL:self.dataURL];id object=data?[NSJSONSerialization JSONObjectWithData:data options:0 error:nil]:nil;
    if([object isKindOfClass:NSDictionary.class]){
        NSString *json=[[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:object options:0 error:nil] encoding:NSUTF8StringEncoding];
        [web.configuration.userContentController removeAllUserScripts];
        [web.configuration.userContentController addUserScript:[[WKUserScript alloc] initWithSource:[@"window.__INITIAL_STATE__=" stringByAppendingString:json] injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES]];
    }
    [web reload];
}
@end
int main(int argc,const char *argv[]){@autoreleasepool{NSApplication *app=NSApplication.sharedApplication;AppDelegate *delegate=[AppDelegate new];app.delegate=delegate;[app run];}return 0;}
