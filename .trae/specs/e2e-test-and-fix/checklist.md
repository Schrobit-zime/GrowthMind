# Checklist

## 修复验证
- [x] auth-provider.tsx 中 fetchProfile 使用 Next.js API 路由，不再依赖 PostgREST
- [x] middleware.ts 中角色查询使用服务端 Drizzle ORM，不再依赖 PostgREST
- [x] export/route.ts 中数据查询使用 Drizzle ORM，不再依赖 PostgREST
- [x] 项目中不再有任何 `supabase.from(` 调用（前端浏览器端）

## 登录流程测试
- [x] 登录页面正确加载，显示邮箱和密码输入框
- [x] 输入 admin@growthmind.com / Admin123456 可以成功登录
- [x] 登录后跳转到 dashboard 页面
- [x] 用户信息（头像、名称）正确显示 - 显示 "下午好，Admin 👋"
- [ ] 退出登录功能正常

## 核心功能测试
- [x] 侧边栏导航正常工作
- [x] 成长记录页面加载正常
- [x] 目标管理页面加载正常
- [x] 数据分析页面加载正常
- [x] 页面切换无报错

## 错误检查
- [x] 控制台无 CORS 错误
- [x] 控制台无 PostgREST 404 错误
- [x] 无未处理的 Promise rejection
