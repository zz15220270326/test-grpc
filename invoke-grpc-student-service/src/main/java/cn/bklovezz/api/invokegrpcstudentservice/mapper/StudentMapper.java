package cn.bklovezz.api.invokegrpcstudentservice.mapper;

import cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentAttendPO;
import cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentInfoPO;
import cn.bklovezz.api.invokegrpcstudentservice.domain.po.StudentScorePO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StudentMapper {
    public abstract Long getStudentInfoTotal(@Param("name") String name);

    public abstract List<StudentInfoPO> getStudentInfoList(
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("name") String name
    );

    public abstract Long getStudentScoreTotal();

    public abstract List<StudentScorePO> getStudentScoreList(
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("ids") List<Integer> ids
    );

    public abstract Long getStudentAttendTotal();

    public abstract List<StudentAttendPO> getStudentAttendList(
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("ids") List<Integer> ids
    );
}
