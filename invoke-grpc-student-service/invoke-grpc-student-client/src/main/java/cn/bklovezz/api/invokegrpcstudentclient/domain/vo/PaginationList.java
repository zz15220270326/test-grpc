package cn.bklovezz.api.invokegrpcstudentclient.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaginationList <T> {
    private Long total;

    private List<T> list;
}
