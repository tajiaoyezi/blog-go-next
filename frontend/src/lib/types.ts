/**
 * 后端通用分页响应结构（对应 backend/internal/repository/base.go 的 PageResult[T]）。
 *
 * 注意字段是 `count`，不是 `total`；历史上有多个管理页误用 `total` 导致分页失效。
 */
export interface PageResult<T> {
  records: T[];
  count: number;
  current: number;
  size: number;
}
